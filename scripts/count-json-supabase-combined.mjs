#!/usr/bin/env node
/**
 * Compares data/restaurants.json with Supabase active restaurants.
 * Dedupes by treating JSON `id` as the same key as Supabase `slug` (how imports map).
 *
 * Usage: node scripts/count-json-supabase-combined.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (from .env.local)
 */

import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const JSON_PATH = path.join(process.cwd(), "data", "restaurants.json");

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

async function fetchAllActiveSlugs(supabase) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, slug")
      .eq("is_active", true)
      .range(from, from + pageSize - 1);

    if (error) {
      const err = new Error(error.message || "supabase_error");
      err.details = error;
      throw err;
    }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function main() {
  const jsonRaw = fs.readFileSync(JSON_PATH, "utf8");
  const jsonList = JSON.parse(jsonRaw);
  if (!Array.isArray(jsonList)) throw new Error("restaurants.json must be an array");

  const jsonKeys = new Set(jsonList.map((r) => norm(r.id)));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("AfriTable — JSON vs Supabase combined count\n");
  console.log(`JSON file: ${JSON_PATH}`);
  console.log(`Restaurants in JSON: ${jsonList.length}`);
  console.log(`Unique JSON ids: ${jsonKeys.size}\n`);

  if (!url || !key) {
    console.log("Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
    console.log("Cannot query DB — combined total needs those variables in .env.local\n");
    console.log("Combined unique (JSON only):", jsonKeys.size);
    process.exit(0);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let sbRows;
  try {
    sbRows = await fetchAllActiveSlugs(supabase);
  } catch (err) {
    console.error("Supabase query failed:", err.message || err);
    console.log("\nFix NEXT_PUBLIC_SUPABASE_* in .env.local, then run: npm run count:combined");
    console.log(`Until then, catalog from JSON only: ${jsonKeys.size} unique listings.\n`);
    process.exit(0);
  }

  const sbSlugs = new Set(sbRows.map((r) => norm(r.slug)));

  /** Same venue if JSON id matches Supabase slug (source-of-truth import convention). */
  let overlap = 0;
  for (const k of jsonKeys) {
    if (sbSlugs.has(k)) overlap++;
  }

  const union = new Set([...jsonKeys, ...sbSlugs]);

  const onlyJson = [...jsonKeys].filter((k) => !sbSlugs.has(k)).length;
  const onlySupabase = [...sbSlugs].filter((k) => !jsonKeys.has(k)).length;

  console.log(`Supabase active rows fetched: ${sbRows.length}`);
  console.log(`Unique Supabase slugs: ${sbSlugs.size}`);
  console.log("");
  console.log("--- Deduped union (JSON id ≡ Supabase slug) ---");
  console.log(`Overlap (in both):     ${overlap}`);
  console.log(`JSON only:             ${onlyJson}`);
  console.log(`Supabase only:         ${onlySupabase}`);
  console.log(`─────────────────────────────`);
  console.log(`COMBINED UNIQUE TOTAL: ${union.size}`);
  console.log("");
  console.log("Formula: unique(JSON ids) ∪ unique(Supabase slugs)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
