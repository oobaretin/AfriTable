/**
 * Apply a Supabase migration file via the Management API.
 *
 * Why this exists
 *   The repo's migrations under supabase/migrations/ have been applied to prod
 *   ad-hoc via the Studio SQL Editor. That manual process has drifted: e.g.
 *   migration 007 (profiles.city column) and 034 (RLS lockdown) are present in
 *   the repo but not in the prod database. Probes confirmed this.
 *
 *   This script gives us a deterministic, idempotent way to apply any single
 *   migration file from a script, using the Management API's database/query
 *   endpoint, so we stop relying on click-and-paste discipline.
 *
 * Usage
 *   node scripts/apply-migration-via-mgmt-api.mjs \
 *     supabase/migrations/034_profiles_rls_pii_lockdown.sql
 *
 * Inputs (from .env.local or environment)
 *   - SUPABASE_ACCESS_TOKEN     Personal Access Token from
 *                               https://supabase.com/dashboard/account/tokens
 *   - NEXT_PUBLIC_SUPABASE_URL  Used to extract project ref.
 *   - argv[2]                   Path to a .sql file inside this repo.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, isAbsolute } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const text = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    // .env.local is optional
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
const migrationArg = process.argv[2];

if (!accessToken) {
  console.error("ERROR: SUPABASE_ACCESS_TOKEN is not set.");
  console.error("Generate one at: https://supabase.com/dashboard/account/tokens");
  console.error("Then add to .env.local:   SUPABASE_ACCESS_TOKEN=sbp_xxx");
  process.exit(1);
}
if (!supabaseUrl) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL is not set.");
  process.exit(1);
}
if (!migrationArg) {
  console.error("ERROR: pass a migration .sql path as the first argument.");
  process.exit(1);
}

const projectRef = extractProjectRef(supabaseUrl);
const migrationPath = isAbsolute(migrationArg) ? migrationArg : resolve(__dirname, "..", migrationArg);
const sql = readFileSync(migrationPath, "utf8");

console.log(`Applying ${migrationPath}`);
console.log(`Target project ref: ${projectRef}`);
console.log("");

const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
const startMs = Date.now();
let response, bodyText;
try {
  response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  bodyText = await response.text();
} catch (err) {
  console.error(`Network error: ${err?.message ?? err}`);
  process.exit(1);
}

const elapsedMs = Date.now() - startMs;
console.log(`HTTP ${response.status} ${response.statusText}  (${elapsedMs}ms)`);
console.log(`Body: ${bodyText.slice(0, 800)}${bodyText.length > 800 ? "..." : ""}`);

if (!response.ok) {
  console.error("\nApply FAILED. Common causes:");
  console.error("  - Token does not have access to this project");
  console.error("  - SQL itself errored (read the body above)");
  process.exit(1);
}

console.log("\nApply SUCCEEDED. Run:  node scripts/verify-profiles-rls.mjs");
