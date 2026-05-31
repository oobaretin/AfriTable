/**
 * Runtime probe: count sitemap URLs (static + cities + restaurants).
 * Usage: node scripts/probe-sitemap.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const t = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of t.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {}
  return env;
}

function citySlugFromDisplayName(displayCity) {
  return displayCity.trim().toLowerCase().replace(/\s+/g, "-");
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = (env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

const staticCount = 10;

const { data: dbRows } = await supabase
  .from("restaurants")
  .select("slug, id")
  .eq("is_active", true)
  .limit(5000);

const { data: cityRows } = await supabase
  .from("restaurants")
  .select("display_city")
  .eq("is_active", true)
  .not("display_city", "is", null);

let jsonCount = 0;
try {
  const raw = readFileSync(resolve(__dirname, "..", "data", "restaurants.json"), "utf8");
  const arr = JSON.parse(raw);
  jsonCount = Array.isArray(arr) ? arr.length : 0;
} catch {
  jsonCount = 0;
}

const seen = new Set();
for (const r of dbRows ?? []) {
  const seg = String(r.slug || r.id || "").trim();
  if (seg) seen.add(seg);
}

const citySlugs = new Set();
for (const r of cityRows ?? []) {
  const c = String(r.display_city ?? "").trim();
  if (c) citySlugs.add(citySlugFromDisplayName(c));
}

console.log(`Base URL: ${baseUrl}`);
console.log(`Static pages: ${staticCount}`);
console.log(`City pages:   ${citySlugs.size}`);
console.log(`DB restaurants (unique paths): ${seen.size}`);
console.log(`JSON catalog rows: ${jsonCount}`);
console.log(`Approx total URLs: ${staticCount + citySlugs.size + seen.size + jsonCount} (JSON may overlap DB)`);
console.log(`Sitemap URL: ${baseUrl}/sitemap.xml`);
