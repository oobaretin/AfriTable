#!/usr/bin/env node
/**
 * Audit data/restaurants.json for data quality and completeness.
 * Use this to identify entries that need manual verification (phone, website, full address).
 * Run: node scripts/audit-restaurant-data.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "restaurants.json");
const data = JSON.parse(readFileSync(dataPath, "utf8"));

const urlRe = /^https?:\/\/.+/i;
const zipRe = /\d{5}(-\d{4})?/;

const missingPhone = [];
const missingWebsite = [];
const badWebsite = [];
const addressNoZip = [];
const missingState = [];

data.forEach((r, i) => {
  if (!r.phone || !String(r.phone).trim()) missingPhone.push({ i, id: r.id, name: r.name, city: r.address?.split(",").slice(-2)?.[0]?.trim() });
  if (!r.website || !String(r.website).trim()) missingWebsite.push({ i, id: r.id, name: r.name });
  else if (r.website && !urlRe.test(String(r.website))) badWebsite.push({ i, id: r.id, name: r.name, website: r.website });
  if (r.address && typeof r.address === "string" && !zipRe.test(r.address)) addressNoZip.push({ i, id: r.id, name: r.name, address: r.address });
  if (!r.state || !String(r.state).trim()) missingState.push({ i, id: r.id, name: r.name });
});

console.log("=== Restaurant data audit (data/restaurants.json) ===\n");
console.log("Total restaurants:", data.length);
console.log("\n--- Needs verification ---\n");
console.log("Missing phone:", missingPhone.length);
missingPhone.forEach((x) => console.log("  -", x.name, "|", x.id, "|", x.city || x.address || ""));
console.log("\nMissing or empty website:", missingWebsite.length);
missingWebsite.slice(0, 20).forEach((x) => console.log("  -", x.name, "|", x.id));
if (missingWebsite.length > 20) console.log("  ... and", missingWebsite.length - 20, "more");
console.log("\nInvalid website URL:", badWebsite.length);
badWebsite.forEach((x) => console.log("  -", x.name, "|", x.website));
console.log("\nAddress without ZIP (needs full address):", addressNoZip.length);
addressNoZip.slice(0, 15).forEach((x) => console.log("  -", x.name, "|", x.address));
if (addressNoZip.length > 15) console.log("  ... and", addressNoZip.length - 15, "more");
console.log("\nMissing state:", missingState.length);
missingState.forEach((x) => console.log("  -", x.name, "|", x.id));

console.log("\n--- Summary ---");
console.log("Entries needing phone research:", missingPhone.length);
console.log("Entries needing website research:", missingWebsite.length);
console.log("Entries needing full address:", addressNoZip.length);
