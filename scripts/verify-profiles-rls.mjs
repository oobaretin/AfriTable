/**
 * Post-migration verification probes for migration 034 (profiles RLS lockdown).
 *
 * P1: anon SELECT all profiles      → MUST return 0 rows (or RLS denial)
 * P2: anon SELECT one profile by id → MUST return 0 rows
 * P3: service-role SELECT profiles  → MUST still return all rows (admin bypass)
 * P4: simulate leaderboard fanout     → admin .in("id", userIds) returns matches
 * P5: per-column schema probe
 * P6: anon SELECT phone/role          → MUST be empty (PII no longer leaks)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const text = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

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

{
  const { data, error, count } = await anon
    .from("profiles")
    .select("id", { count: "exact", head: false });
  console.log(
    `P1 anon SELECT all profiles → rows=${data?.length ?? 0} count=${count} err=${error?.code ?? "none"} msg=${error?.message ?? ""}`,
  );
}

{
  const { data: oneAdmin } = await admin.from("profiles").select("id").limit(1).maybeSingle();
  const testId = oneAdmin?.id;
  const { data, error } = await anon
    .from("profiles")
    .select("id, full_name")
    .eq("id", testId ?? "00000000-0000-0000-0000-000000000000");
  console.log(`P2 anon SELECT by id → rows=${data?.length ?? 0} err=${error?.code ?? "none"}`);
}

{
  const { error, count } = await admin.from("profiles").select("id", { count: "exact", head: true });
  console.log(`P3 admin SELECT profiles → count=${count} err=${error?.code ?? "none"}`);
}

{
  const { data: sampleUserIds } = await admin.from("profiles").select("id").limit(5);
  const ids = (sampleUserIds ?? []).map((r) => r.id);
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, city, avatar_url")
    .in("id", ids);
  console.log(
    `P4 admin leaderboard fanout → matched=${data?.length ?? 0}/${ids.length} err=${error?.code ?? "none"}`,
  );
}

{
  const cols = ["id", "full_name", "phone", "role", "avatar_url", "city", "created_at"];
  const results = {};
  for (const col of cols) {
    const { error } = await admin.from("profiles").select(col).limit(1);
    results[col] = { ok: !error, code: error?.code ?? null, msg: error?.message?.slice(0, 100) ?? null };
  }
  console.log(`P5 per-column probe:`);
  for (const [col, r] of Object.entries(results)) {
    console.log(`   ${col.padEnd(12)} ${r.ok ? "OK" : `MISSING (${r.code}) ${r.msg}`}`);
  }
}

{
  const { data, error } = await anon.from("profiles").select("phone, role").limit(5);
  console.log(`P6 anon SELECT phone/role → rows=${data?.length ?? 0} err=${error?.code ?? "none"}`);
}

console.log("\nProbes complete.");
