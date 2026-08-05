#!/usr/bin/env node
/**
 * Top partner outreach candidates by metro — phone, hours, venue photos, high rating.
 * Usage: npm run partner:outreach
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { hasVenuePhoto, photoOnlyStreetView } from "./lib/catalog-photo-rank.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(ROOT, ".env.local") });

const METROS = [
  { key: "houston", match: /\b(Houston|Katy|Cypress|Meadows Place|Stafford|Missouri City|Richmond|Bellaire|Humble|Spring)\b.*,\s*TX/i },
  { key: "boston", match: /\b(Boston|Cambridge|Somerville|Brookline|Mattapan|Roslindale|Dorchester|Jamaica Plain|Quincy|Malden)\b.*,\s*MA/i },
  { key: "denver", match: /\b(Denver|Aurora|Lakewood|Commerce City|Thornton|Arvada|Westminster|Centennial|Boulder)\b.*,\s*CO/i },
  { key: "atlanta", match: /\b(Atlanta|Decatur|Marietta|Sandy Springs|Stone Mountain|Lithonia|College Park|East Point)\b.*,\s*GA/i },
  { key: "minneapolis", match: /\b(Minneapolis|St\. Paul|Saint Paul|Bloomington|Brooklyn Park|Plymouth|Maplewood|Roseville)\b.*,\s*MN/i },
];

function hasHours(h) {
  if (!h) return false;
  if (Array.isArray(h)) return h.length > 0;
  if (typeof h === "object") return Object.keys(h).length > 0;
  return typeof h === "string" && h.trim().length > 0;
}

function isOutreachReady(r) {
  return (
    r.phone &&
    hasHours(r.hours) &&
    r.address &&
    /,\s*[A-Z]{2}\b/.test(r.address) &&
    hasVenuePhoto(r.images) &&
    !photoOnlyStreetView(r.images) &&
    (r.rating ?? 0) >= 4.0
  );
}

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
  console.warn("Supabase unavailable — showing all candidates (claimed filter skipped)");
}

const baseUrlRaw = process.env.NEXT_PUBLIC_APP_URL || "https://afritable.com";
const baseUrl = /localhost|127\.0\.0\.1/.test(baseUrlRaw) ? "https://afritable.com" : baseUrlRaw;
const candidates = [];

for (const metro of METROS) {
  const pool = catalog
    .filter((r) => metro.match.test(String(r.address || "")))
    .filter(isOutreachReady)
    .filter((r) => !claimedSlugs.has(r.id))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  for (const r of pool.slice(0, 5)) {
    candidates.push({
      metro: metro.key,
      slug: r.id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      address: r.address,
      phone: r.phone,
      website: r.website || null,
      claim_url: `${baseUrl}/restaurant/${encodeURIComponent(r.id)}/claim`,
      detail_url: `${baseUrl}/restaurants/${encodeURIComponent(r.id)}`,
      priority: pool.indexOf(r) === 0 ? "primary" : "secondary",
    });
  }
}

const out = {
  generated_at: new Date().toISOString(),
  description: "Top unclaimed dine-in listings to invite for AfriTable partner booking.",
  candidate_count: candidates.length,
  candidates,
};

writeFileSync(join(ROOT, "data", "partner-outreach-candidates.json"), JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(`Partner outreach: ${candidates.length} candidates across ${METROS.length} metros`);
for (const m of METROS) {
  const n = candidates.filter((c) => c.metro === m.key).length;
  console.log(`  ${m.key}: ${n}`);
}
console.log("\nSaved: data/partner-outreach-candidates.json");
