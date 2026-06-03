#!/usr/bin/env node
/**
 * Verify "You might also like" data path for slug-based restaurant URLs.
 */
import path from "node:path";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

async function similarWithSlug(supabase, slug) {
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
    .select("slug, cuisine_types")
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

const broken = await similarWithSlug(supabase, testSlug);
const fixed = row?.id ? await similarWithUuid(supabase, row.id, row.cuisine_types) : { count: 0 };

const verdict = fixed.count >= 1 ? "PASS" : "FAIL";

console.log(`Similar restaurants verify (${testSlug})`);
console.log(`  Broken (slug as UUID): ${broken.count} rows, error=${broken.error ?? "none"}`);
console.log(`  Fixed (real UUID):     ${fixed.count} rows`);
console.log(`  Verdict:               ${verdict}`);

if (verdict === "FAIL") process.exit(1);
