#!/usr/bin/env node
/**
 * Apply verified websites from data/researched-websites.json to catalog + Supabase.
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

const CATALOG = path.join(process.cwd(), "data", "restaurants.json");
const RESEARCH = path.join(process.cwd(), "data", "researched-websites.json");

function requireEnv(n) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

function buildGoogleSearchUrl(entry) {
  const q = [entry.name, entry.address].filter(Boolean).join(", ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

async function main() {
  const { websites } = JSON.parse(fs.readFileSync(RESEARCH, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const { data: dbRows } = await supabase.from("restaurants").select("id,slug,website").eq("is_active", true);
  const dbBySlug = new Map((dbRows ?? []).map((r) => [r.slug, r]));

  let applied = 0;
  for (const entry of catalog) {
    const url = websites[entry.id];
    if (!url) continue;
    entry.website = url;
    entry.google_search_url = buildGoogleSearchUrl(entry);
    applied++;
    const db = dbBySlug.get(entry.id);
    if (db) {
      await supabase.from("restaurants").update({ website: url }).eq("id", db.id);
    }
    console.log(`  ${entry.id} -> ${url}`);
  }

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2));
  console.log(`\nApplied ${applied} researched websites to catalog and Supabase.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
