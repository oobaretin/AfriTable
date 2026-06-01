#!/usr/bin/env node
/**
 * Verify "You might also like" data path for slug-based restaurant URLs.
 */
import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const LOG_PATH = path.join(process.cwd(), ".cursor", "debug-fc91e6.log");
const SESSION_ID = "fc91e6";

function agentLog(hypothesisId, message, data) {
  const line = JSON.stringify({
    sessionId: SESSION_ID,
    runId: "similar-verify",
    hypothesisId,
    location: "verify-similar-restaurants.mjs",
    message,
    data,
    timestamp: Date.now(),
  });
  try {
    fs.appendFileSync(LOG_PATH, `${line}\n`);
  } catch {
    /* ignore disk full */
  }
  // #region agent log
  fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": SESSION_ID },
    body: line,
  }).catch(() => {});
  // #endregion
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function loadEnv() {
  const env = { ...process.env };
  try {
    const t = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of t.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {}
  return env;
}

async function similarWithSlug(supabase, slug, cuisines) {
  const { data, error } = await supabase
    .from("restaurants_with_rating")
    .select("slug")
    .eq("is_active", true)
    .neq("id", slug)
    .limit(6);
  return { count: data?.length ?? 0, error: error?.message ?? null };
}

async function similarWithUuid(supabase, uuid, cuisines) {
  if (!cuisines?.length) return { count: 0, reason: "no_cuisines" };
  const { data, error } = await supabase
    .from("restaurants_with_rating")
    .select("slug")
    .eq("is_active", true)
    .neq("id", uuid)
    .limit(50);
  if (error) return { count: 0, error: error.message };
  const cuisineSet = new Set(cuisines.map((c) => c.toLowerCase()));
  const matching = (data ?? []).filter(
    (r) =>
      Array.isArray(r.cuisine_types) &&
      r.cuisine_types.some((c) => cuisineSet.has(String(c).toLowerCase())),
  );
  const pool = matching.length >= 3 ? matching : data ?? [];
  return { count: Math.min(6, pool.length), matching: matching.length, dbRows: data?.length };
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const testSlug = process.argv[2] || "hou-003";
const { data: row } = await supabase
  .from("restaurants")
  .select("id,slug,cuisine_types")
  .eq("slug", testSlug)
  .maybeSingle();

const broken = await similarWithSlug(supabase, testSlug, row?.cuisine_types);
const fixed = row?.id ? await similarWithUuid(supabase, row.id, row.cuisine_types) : { count: 0 };

agentLog("H1", "slug neq uuid (broken path)", { testSlug, ...broken });
agentLog("H2", "resolved uuid (fixed path)", { testSlug, uuid: row?.id, cuisines: row?.cuisine_types, ...fixed });

const verdict = fixed.count >= 1 ? "PASS" : "FAIL";
agentLog("H2", "verdict", { verdict, similarCount: fixed.count });

console.log(`Similar restaurants verify (${testSlug})`);
console.log(`  Broken (slug as UUID): ${broken.count} rows, error=${broken.error ?? "none"}`);
console.log(`  Fixed (real UUID):     ${fixed.count} rows`);
console.log(`  Verdict:               ${verdict}`);
console.log(`  Log: ${LOG_PATH}`);

if (verdict === "FAIL") process.exit(1);
