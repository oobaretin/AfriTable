/**
 * Batch-apply any missing migrations to prod via the Supabase Management API.
 *
 * Strategy
 *   1. Take a hardcoded list of migration filenames (from this session's audit).
 *   2. For each, read the .sql, POST to mgmt-API /database/query, log status.
 *   3. Stop on the first non-2xx response and exit non-zero. The next run can
 *      pick up from the failure point by editing the FILES list.
 *
 * Why hardcoded list rather than re-running the audit
 *   Migrations should be applied in a known, reviewed order. Pulling the list
 *   dynamically introduces "whatever the audit currently says" semantics — too
 *   easy to apply unintended changes. The list below was generated from the
 *   audit output captured at 2026-05-12 ~14:10 CT and reviewed manually.
 *
 * Usage
 *   node scripts/apply-missing-migrations.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Audit output (2026-05-12): 20 MISSING + 2 NO-SIG (010 indexes / 016 enum
// — both idempotent, safe to apply even if already in prod).
const FILES = [
  "004_reservations_rpc_and_guest_support.sql",
  "005_reservation_rules.sql",
  "006_dashboard_fields.sql",
  "007_user_features.sql",
  "008_no_show_trigger.sql",
  "009_reviews_fields_and_policies.sql",
  "010_indexes.sql",
  "013_restaurants_verification_jsonb.sql",
  "014_restaurants_claiming.sql",
  "015_restaurant_claim_requests.sql",
  "016_user_role_pending_owner.sql",
  "017_restaurant_submissions.sql",
  "018_restaurant_submissions_email_optional.sql",
  "019_restaurant_submissions_owner_invite_fields.sql",
  "020_restaurant_submissions_verification_and_admin_notes.sql",
  "021_restaurant_submissions_status_v2.sql",
  "022_submission_events.sql",
  "023_restaurant_submissions_invite_token.sql",
  "024_profiles_has_reset_password.sql",
  "025_restaurants_published_at.sql",
  "032_stamps_table.sql",
  "033_add_event_type_to_stamps.sql",
];

function loadEnv() {
  const env = { ...process.env };
  try {
    const text = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    // optional
  }
  return env;
}

function extractProjectRef(url) {
  const m = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!m) throw new Error(`Cannot extract project ref from ${url}`);
  return m[1];
}

const env = loadEnv();
const projectRef = extractProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
const accessToken = env.SUPABASE_ACCESS_TOKEN;
if (!accessToken) {
  console.error("ERROR: SUPABASE_ACCESS_TOKEN not set");
  process.exit(1);
}
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
const migrationsDir = resolve(__dirname, "..", "supabase", "migrations");

console.log(`Project: ${projectRef}`);
console.log(`Applying ${FILES.length} migrations in numeric order. Stop on first error.\n`);

let applied = 0;
const startedAt = Date.now();
for (const file of FILES) {
  const sql = readFileSync(resolve(migrationsDir, file), "utf8");
  const t = Date.now();
  let response, body;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    });
    body = await response.text();
  } catch (err) {
    console.error(`[${file}] NETWORK ERROR: ${err?.message ?? err}`);
    process.exit(1);
  }
  const elapsed = Date.now() - t;
  const tag = response.ok ? "OK  " : "FAIL";
  const bodyShort = body.length > 200 ? body.slice(0, 200) + "..." : body;
  console.log(`[${tag}] ${file.padEnd(56)} HTTP ${response.status} ${elapsed}ms  ${bodyShort}`);
  if (!response.ok) {
    console.error(`\nFailed at ${file}. ${applied}/${FILES.length} migrations applied before failure.`);
    console.error("Fix the migration (or its preconditions), then trim the FILES array to start from this file and re-run.");
    process.exit(1);
  }
  applied++;
}

const totalMs = Date.now() - startedAt;
console.log(`\nDone. ${applied}/${FILES.length} migrations applied in ${totalMs}ms.`);
console.log("Run:  node scripts/audit-migration-drift.mjs  to confirm 0 missing.");
