#!/usr/bin/env node
/**
 * Set AfriTable branded placeholder on catalog entries missing real photos.
 * Run: node scripts/backfill-catalog-image-placeholders.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BRAND = "/restaurant-card-placeholder.svg";
const STOCK_PREFIX = "https://images.unsplash.com/";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "restaurants.json");
const dryRun = process.argv.includes("--dry-run");

function needsPlaceholder(images) {
  if (!Array.isArray(images) || images.length === 0) return true;
  const first = String(images[0] ?? "").trim();
  if (!first) return true;
  if (first.startsWith(STOCK_PREFIX)) return true;
  return false;
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
let updated = 0;

for (const r of catalog) {
  if (!needsPlaceholder(r.images)) continue;
  r.images = [BRAND];
  updated++;
}

console.log(`Catalog: ${catalog.length} restaurants, ${updated} set to AfriTable placeholder`);
if (dryRun) {
  console.log("(dry-run — not writing file)");
  process.exit(0);
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`Wrote ${catalogPath}`);
