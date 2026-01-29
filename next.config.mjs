/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { dev, isServer }) {
    // Prevent dev-only filesystem cache corruption that can cause missing chunk/CSS 404s.
    if (dev) config.cache = false;

    // Fix rare dev-time "Cannot find module './1234.js'" server errors where the server runtime
    // tries to require chunks from `.next/server/` but webpack emits them under `.next/server/chunks/`.
    // Ensures `__webpack_require__.u()` resolves to `chunks/<id>.js` for server bundles.
    if (dev && isServer) {
      const current = config.output?.chunkFilename;
      if (typeof current === "string") {
        if (!current.startsWith("chunks/")) {
          config.output.chunkFilename = `chunks/${current}`;
        }
      } else {
        config.output = config.output || {};
        config.output.chunkFilename = "chunks/[id].js";
      }
    }

    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow common remote image hosts; tighten this list for production as needed.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      // We add Supabase and Vercel specific domains to the allowed list
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      // connect-src must allow Supabase for database calls
      "connect-src 'self' https: wss: https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // HSTS only in production (Vercel provides HTTPS)
          ...(isDev
            ? []
            : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
        ],
      },
    ];
  },
};

export default nextConfig;

