#!/usr/bin/env node
/**
 * Audit Denver / Aurora / Colorado catalog listings for scrape noise.
 * Usage: npm run audit:denver-metro
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPhotoUrl, hasVenuePhoto, photoOnlyStreetView } from "./lib/catalog-photo-rank.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "data", "restaurants.json");
const OUT = join(ROOT, "data", "denver-metro-audit.json");

const WEAK_STORY = /serves african flavors to diners in .+ and surrounding communities/i;
const WEAK_ABOUT = WEAK_STORY;
const WEAK_SPECIALTY = /call for seasonal|coming soon/i;
const CO_CITIES = /,\s*(Denver|Aurora|Lakewood|Commerce City|Thornton|Arvada|Westminster|Centennial|Boulder|Colorado Springs),?\s*CO\b/i;

function flags(r) {
  const f = [];
  if (WEAK_STORY.test(String(r.our_story || ""))) f.push("templated_story");
  if (WEAK_ABOUT.test(String(r.about || ""))) f.push("templated_about");
  const spec = r.specialty || r.menu_highlights?.[0];
  if (!spec || WEAK_SPECIALTY.test(spec)) f.push("weak_specialty");
  const web = String(r.website || "");
  if (web && /instagram\.com/i.test(web) && !/facebook|\.com\/(?!instagram)/i.test(web.replace(/instagram\.com.*/, ""))) {
    if (/instagram\.com/i.test(web)) f.push("instagram_only");
  }
  if (photoOnlyStreetView(r.images)) f.push("street_view_only");
  else if (!hasVenuePhoto(r.images)) f.push("no_venue_photo");
  if (!r.phone) f.push("missing_phone");
  if (!r.hours || (typeof r.hours === "object" && !Object.keys(r.hours).length)) f.push("missing_hours");
  return f;
}

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const co = catalog.filter(
  (r) => r.state === "CO" || CO_CITIES.test(String(r.address || "")),
);

const rows = co.map((r) => ({
  id: r.id,
  name: r.name,
  address: r.address,
  website: r.website || null,
  flags: flags(r),
  risk_score: flags(r).length,
}));

rows.sort((a, b) => b.risk_score - a.risk_score || a.name.localeCompare(b.name));

const high = rows.filter((r) => r.risk_score >= 4);

const report = {
  generated_at: new Date().toISOString(),
  total_co: co.length,
  high_risk_count: high.length,
  high_risk: high,
  all: rows,
};

writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(`Denver metro audit: ${co.length} CO listings, ${high.length} high-risk (≥4 flags)`);
for (const r of high.slice(0, 15)) {
  console.log(`  ${r.name} — ${r.flags.join(", ")}`);
}
console.log(`\nFull report: data/denver-metro-audit.json`);
