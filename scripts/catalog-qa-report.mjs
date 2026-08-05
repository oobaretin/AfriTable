#!/usr/bin/env node
/**
 * CLI catalog QA report (same flags as admin /admin/catalog-qa).
 * Usage: npm run catalog:qa
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPhotoUrl, hasVenuePhoto, photoOnlyStreetView } from "./lib/catalog-photo-rank.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "data", "restaurants.json");

const WEAK_SPECIALTY = /call for seasonal|coming soon|seasonal specials only/i;
const TEMPLATED_ABOUT =
  /^Authentic .+ restaurant in .+\. Experience traditional .+ flavors and hospitality at/i;
const WEAK_ABOUT = /serves african flavors to diners in .+ and surrounding communities/i;

function cityFromAddress(addr) {
  if (!addr || typeof addr !== "string") return "—";
  const parts = addr.split(",").map((s) => s.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

function hasHours(h) {
  if (!h) return false;
  if (Array.isArray(h)) return h.length > 0;
  if (typeof h === "object") return Object.keys(h).length > 0;
  return typeof h === "string" && h.trim().length > 0;
}

function hasRealImage(images) {
  return (images ?? []).some((u) => {
    const q = classifyPhotoUrl(u);
    return q === "venue" || q === "street_view";
  });
}

function issuesFor(r) {
  const issues = [];
  if (!hasRealImage(r.images)) issues.push("placeholder_image");
  else if (photoOnlyStreetView(r.images)) issues.push("street_view_only");
  else if (!hasVenuePhoto(r.images)) issues.push("street_view_only");
  if (!String(r.website || "").trim()) issues.push("missing_website");
  if (TEMPLATED_ABOUT.test(String(r.about || "")) || WEAK_ABOUT.test(String(r.about || ""))) {
    issues.push("templated_about");
  }
  const spec = r.specialty || r.menu_highlights?.[0];
  if (!spec || WEAK_SPECIALTY.test(spec)) issues.push("weak_specialty");
  if (!String(r.phone || "").trim()) issues.push("missing_phone");
  if (!hasHours(r.hours)) issues.push("missing_hours");
  if (!String(r.google_place_id || "").trim()) issues.push("missing_place_id");
  return issues;
}

function trustScore(r) {
  let s = 0;
  if (r.phone) s += 2;
  if (hasHours(r.hours)) s += 2;
  if (r.address && /,\s*[A-Z]{2}\b/.test(r.address)) s += 2;
  if (hasVenuePhoto(r.images)) s += 3;
  if (r.website) s += 1;
  if (r.google_place_id) s += 1;
  if (photoOnlyStreetView(r.images)) s -= 2;
  return s;
}

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const rows = [];
const counts = {};

for (const r of catalog) {
  const issues = issuesFor(r);
  for (const i of issues) counts[i] = (counts[i] || 0) + 1;
  if (issues.length) rows.push({ id: r.id, name: r.name, city: cityFromAddress(r.address), issues });
}

rows.sort((a, b) => a.name.localeCompare(b.name));

let vetted = 0;
for (const r of catalog) {
  const iss = issuesFor(r);
  if (
    r.phone &&
    hasHours(r.hours) &&
    r.address &&
    /,\s*[A-Z]{2}\b/.test(r.address) &&
    hasVenuePhoto(r.images) &&
    !photoOnlyStreetView(r.images)
  ) {
    vetted++;
  }
}

console.log("Catalog QA report");
console.log(`  Total:    ${catalog.length}`);
console.log(`  Vetted:   ${vetted}`);
console.log(`  Flagged:  ${rows.length}`);
console.log("\nIssue counts:");
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log("\nTop 25 needing attention:");
for (const row of rows.slice(0, 25)) {
  console.log(`  ${row.name} (${row.city}) — ${row.issues.join(", ")}`);
}

process.exit(rows.length ? 0 : 0);
