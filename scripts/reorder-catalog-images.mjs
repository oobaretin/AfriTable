#!/usr/bin/env node
/**
 * Reorder images[] in restaurants.json — venue photos before Street View.
 * Usage: npm run catalog:reorder-images [--dry-run]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rankRestaurantImages } from "./lib/catalog-photo-rank.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "data", "restaurants.json");
const dryRun = process.argv.includes("--dry-run");

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
let changed = 0;

for (const r of catalog) {
  if (!r.images?.length) continue;
  const ranked = rankRestaurantImages(r.images);
  if (!ranked.length) continue;
  const same =
    ranked.length === r.images.length && ranked.every((u, i) => u === r.images[i]);
  if (!same) {
    changed++;
    if (!dryRun) r.images = ranked;
    console.log(`${dryRun ? "[dry-run] " : ""}${r.id}: reordered ${r.images.length} → ${ranked.length} photos`);
  }
}

if (!dryRun && changed) {
  writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
}
console.log(`\n${dryRun ? "Would update" : "Updated"} ${changed} listings.`);
