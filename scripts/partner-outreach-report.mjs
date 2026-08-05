#!/usr/bin/env node
/**
 * All vetted unclaimed dine-in listings nationwide for partner outreach.
 * Usage: npm run partner:outreach
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  cityFromAddress,
  isVettedDineIn,
  stateFromRecord,
} from "./lib/catalog-vetted.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(ROOT, ".env.local") });

const catalog = JSON.parse(readFileSync(join(ROOT, "data", "restaurants.json"), "utf8"));

let claimedSlugs = new Set();
try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { data } = await supabase.from("restaurants").select("slug, is_claimed").eq("is_claimed", true);
  claimedSlugs = new Set((data ?? []).map((r) => r.slug));
} catch {
  console.warn("Supabase unavailable — showing all vetted candidates (claimed filter skipped)");
}

const baseUrlRaw = process.env.NEXT_PUBLIC_APP_URL || "https://afritable.com";
const baseUrl = /localhost|127\.0\.0\.1/.test(baseUrlRaw) ? "https://afritable.com" : baseUrlRaw;

const pool = catalog
  .filter(isVettedDineIn)
  .filter((r) => !claimedSlugs.has(r.id))
  .sort((a, b) => (b.rating || 0) - (a.rating || 0) || String(a.name).localeCompare(String(b.name)));

const candidates = pool.map((r) => {
  const city = cityFromAddress(r.address);
  const state = stateFromRecord(r);
  const rating = r.rating ?? 0;
  return {
    slug: r.id,
    name: r.name,
    cuisine: r.cuisine || "African",
    rating,
    address: r.address,
    city,
    state,
    phone: r.phone,
    website: r.website || null,
    claim_url: `${baseUrl}/restaurant/${encodeURIComponent(r.id)}/claim`,
    detail_url: `${baseUrl}/restaurants/${encodeURIComponent(r.id)}`,
    priority: rating >= 4.8 ? "primary" : "secondary",
  };
});

const byState = {};
for (const c of candidates) {
  byState[c.state] = (byState[c.state] || 0) + 1;
}

const out = {
  generated_at: new Date().toISOString(),
  description: "All vetted unclaimed dine-in listings nationwide (phone, hours, address, venue photos).",
  candidate_count: candidates.length,
  states: Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .map(([state, count]) => ({ state, count })),
  candidates,
};

writeFileSync(join(ROOT, "data", "partner-outreach-candidates.json"), JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(`Partner outreach: ${candidates.length} vetted unclaimed listings nationwide`);
console.log(`  States: ${Object.keys(byState).length}`);
for (const [state, count] of Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`  ${state}: ${count}`);
}
if (Object.keys(byState).length > 12) console.log("  …");
console.log("\nSaved: data/partner-outreach-candidates.json");
