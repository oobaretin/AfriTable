import "server-only";

/**
 * Canonical site origin for server-side URLs (sitemap, robots, emails, metadata).
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL — explicit override (local .env.local or Vercel when you can set it)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel-injected production hostname (no extra config)
 *   3. VERCEL_URL — current deployment host (*.vercel.app or custom domain on that deploy)
 *   4. http://localhost:3000 — local dev fallback
 *
 * On Vercel Hobby/Pro, (2) and (3) are set automatically at build and runtime, so you do
 * not need a paid env-var slot for the sitemap to use your live URL.
 */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return ensureHttpsOrigin(productionHost);

  const deploymentHost = process.env.VERCEL_URL?.trim();
  if (deploymentHost) return ensureHttpsOrigin(deploymentHost);

  return "http://localhost:3000";
}

function ensureHttpsOrigin(hostOrUrl: string): string {
  const trimmed = hostOrUrl.replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
