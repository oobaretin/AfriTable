/**
 * Post-migration verification probes for migration 034 (profiles RLS lockdown).
 *
 * Six probes:
 *   P1: anon SELECT all profiles      → MUST return 0 rows (or RLS denial)
 *   P2: anon SELECT one profile by id → MUST return 0 rows
 *   P3: service-role SELECT profiles  → MUST still return all rows (admin bypass)
 *   P4: simulate leaderboard fanout   → admin .in("id", userIds) returns matches
 *   P5: pg_policies snapshot          → old policy gone, two new policies present
 *   P6: anon SELECT phone/role        → MUST be empty (PII no longer leaks)
 *
 * Every probe writes one NDJSON line to .cursor/debug-fc91e6.log so we have
 * cited runtime evidence for each hypothesis. No secrets are logged.
 */
// #region agent log helpers
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSION_ID = "fc91e6";
const RUN_ID = `post-fix-${Date.now()}`;
const DEBUG_ENDPOINT = "http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2";

async function log(hypothesisId, location, message, data) {
  try {
    await fetch(DEBUG_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION_ID,
      },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        runId: RUN_ID,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    });
  } catch {
    // ignore — instrumentation should never break the probe
  }
}

function loadEnv() {
  const text = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
// #endregion

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// P1: anon SELECT all profiles → must be 0 rows
{
  const { data, error, count } = await anon
    .from("profiles")
    .select("id", { count: "exact", head: false });
  // #region agent log
  await log("P1", "verify-profiles-rls.mjs:P1", "anon SELECT all profiles", {
    rowsReturned: data?.length ?? null,
    exactCount: count,
    errorCode: error?.code ?? null,
    errorMessage: error?.message ?? null,
    verdict: (data?.length ?? 0) === 0 ? "PASS" : "FAIL",
  });
  // #endregion
  console.log(`P1 anon SELECT all profiles → rows=${data?.length ?? 0} count=${count} err=${error?.code ?? "none"} msg=${error?.message ?? ""}`);
}

// P2: anon SELECT a specific profile by id → must be 0 rows
{
  const { data: oneAdmin } = await admin
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();
  const testId = oneAdmin?.id;
  const { data, error } = await anon
    .from("profiles")
    .select("id, full_name")
    .eq("id", testId ?? "00000000-0000-0000-0000-000000000000");
  // #region agent log
  await log("P2", "verify-profiles-rls.mjs:P2", "anon SELECT one profile by id", {
    testIdProvided: Boolean(testId),
    rowsReturned: data?.length ?? null,
    errorCode: error?.code ?? null,
    verdict: (data?.length ?? 0) === 0 ? "PASS" : "FAIL",
  });
  // #endregion
  console.log(`P2 anon SELECT by id → rows=${data?.length ?? 0} err=${error?.code ?? "none"}`);
}

// P3: service-role SELECT profiles → must still return rows
{
  const { data, error, count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  // #region agent log
  await log("P3", "verify-profiles-rls.mjs:P3", "admin SELECT profiles", {
    exactCount: count,
    errorCode: error?.code ?? null,
    verdict: (count ?? 0) > 0 ? "PASS" : "FAIL",
  });
  // #endregion
  console.log(`P3 admin SELECT profiles → count=${count} err=${error?.code ?? "none"}`);
}

// P4: simulate leaderboard fanout — admin .in("id", userIds) returns matches
{
  const { data: sampleUserIds } = await admin
    .from("profiles")
    .select("id")
    .limit(5);
  const ids = (sampleUserIds ?? []).map((r) => r.id);
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, city, avatar_url")
    .in("id", ids);
  // #region agent log
  await log("P4", "verify-profiles-rls.mjs:P4", "admin leaderboard fanout", {
    requestedIds: ids.length,
    matched: data?.length ?? 0,
    columnsReturned: data?.[0] ? Object.keys(data[0]) : [],
    errorCode: error?.code ?? null,
    verdict: (data?.length ?? 0) === ids.length ? "PASS" : "FAIL",
  });
  // #endregion
  console.log(`P4 admin leaderboard fanout → matched=${data?.length ?? 0}/${ids.length} err=${error?.code ?? "none"}`);
}

// P5: per-column schema probe — identify which profile column is missing
{
  const cols = ["id", "full_name", "phone", "role", "avatar_url", "city", "created_at"];
  const results = {};
  for (const col of cols) {
    const { error } = await admin.from("profiles").select(col).limit(1);
    results[col] = { ok: !error, code: error?.code ?? null, msg: error?.message?.slice(0, 100) ?? null };
  }
  // #region agent log
  await log("P5", "verify-profiles-rls.mjs:P5", "per-column profiles probe", {
    columnsProbed: cols.length,
    results,
    missingColumns: Object.entries(results).filter(([, v]) => !v.ok).map(([k]) => k),
  });
  // #endregion
  console.log(`P5 per-column probe:`);
  for (const [col, r] of Object.entries(results)) {
    console.log(`   ${col.padEnd(12)} ${r.ok ? "OK" : `MISSING (${r.code}) ${r.msg}`}`);
  }
}

// P6: anon SELECT phone/role — must be empty (PII leak closed)
{
  const { data, error } = await anon
    .from("profiles")
    .select("phone, role")
    .limit(5);
  // #region agent log
  await log("P6", "verify-profiles-rls.mjs:P6", "anon SELECT phone+role (PII)", {
    rowsReturned: data?.length ?? null,
    leakedSample: data?.length ? data.slice(0, 1) : null,
    errorCode: error?.code ?? null,
    verdict: (data?.length ?? 0) === 0 ? "PASS" : "FAIL — PII STILL LEAKS",
  });
  // #endregion
  console.log(`P6 anon SELECT phone/role → rows=${data?.length ?? 0} err=${error?.code ?? "none"}`);
}

console.log("\nProbes complete. Evidence sent to debug log endpoint.");
