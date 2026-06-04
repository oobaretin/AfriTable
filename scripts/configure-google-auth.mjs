/**
 * Enable Google OAuth on Supabase via the Management API.
 *
 * Prerequisites (one-time, in Google Cloud Console):
 *   1. Create OAuth client (Web application)
 *   2. Authorized redirect URI:
 *        https://<project-ref>.supabase.co/auth/v1/callback
 *   3. Authorized JavaScript origins:
 *        https://afri-table.com
 *        http://localhost:3000
 *
 * Required in .env.local (or environment):
 *   SUPABASE_ACCESS_TOKEN   — https://supabase.com/dashboard/account/tokens
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL  — used to derive project ref
 *
 * Optional:
 *   APP_BASE_URL — production site URL (default https://afri-table.com)
 *
 * Usage:
 *   node scripts/configure-google-auth.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const text = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    // optional
  }
  return env;
}

function extractProjectRef(supabaseUrl) {
  const m = supabaseUrl?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!m) throw new Error(`Cannot extract project ref from NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
  return m[1];
}

const env = loadEnv();
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
const appBaseUrl = (env.APP_BASE_URL || env.NEXT_PUBLIC_APP_URL || "https://afri-table.com").replace(/\/$/, "");

const required = [
  ["SUPABASE_ACCESS_TOKEN", accessToken],
  ["GOOGLE_OAUTH_CLIENT_ID", clientId],
  ["GOOGLE_OAUTH_CLIENT_SECRET", clientSecret],
  ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
];

for (const [name, value] of required) {
  if (!value) {
    console.error(`ERROR: ${name} is not set. Add it to .env.local and retry.`);
    process.exit(1);
  }
}

const projectRef = extractProjectRef(supabaseUrl);
const redirectAllowList = [
  `${appBaseUrl}/auth/callback`,
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
].join("\n");

const payload = {
  external_google_enabled: true,
  external_google_client_id: clientId,
  external_google_secret: clientSecret,
  site_url: appBaseUrl,
  uri_allow_list: redirectAllowList,
};

console.log(`Configuring Google OAuth for Supabase project: ${projectRef}`);
console.log(`Site URL: ${appBaseUrl}`);
console.log(`Redirect allow list:\n${redirectAllowList.split("\n").map((u) => `  - ${u}`).join("\n")}`);
console.log("");

const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const response = await fetch(endpoint, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const bodyText = await response.text();
if (!response.ok) {
  console.error(`Management API error (${response.status}):`);
  console.error(bodyText);
  process.exit(1);
}

console.log("Supabase Google provider configured successfully.");
console.log("");
console.log("Next steps:");
console.log("  1. Set NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true in .env.local and Vercel");
console.log("  2. Redeploy production (or restart `npm run dev` locally)");
console.log("  3. Run: node scripts/probe-google-auth.mjs");
