#!/usr/bin/env node
/**
 * Remove restaurants that:
 * 1. Don't align with AfriTable purpose (African/Caribbean/diaspora)
 * 2. Are permanently closed
 * 3. Don't have a proper full address (street + ZIP)
 *
 * Run: node scripts/remove-outdated-restaurants.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "restaurants.json");

const data = JSON.parse(readFileSync(dataPath, "utf8"));

// Permanently closed (from research / about notes)
const PERMANENTLY_CLOSED = [
  "nyc-berber",       // Berber Street Food - reported permanently closed
  "clt-leah-louise",  // Leah & Louise - sources report permanently closed
  "ile-bistro-la",    // ILÉ Bistro - Timeout listed CLOSED
  "dc-003",           // Elfegne - Yelp listed CLOSED
];

// No proper address (neighborhood or city-only, no street + ZIP)
const NO_PROPER_ADDRESS = [
  "dc-002",           // Mansyon - U Street Corridor only
  "mia-001",          // Chef Adrienne's - Little Haiti only
  "mia-003",          // Manjay - The Citadel only
  "atl-lucia",        // Lucia - Midtown only
  "sf-fine-001",      // Canje - pop-up, no fixed address
];

// Doesn't align with AfriTable (African/Caribbean/diaspora dining)
const NON_ALIGNED = [
  "la-002",           // Jitlada - Southern Thai (Michelin Bib Thai, not African)
  "nyc-buvette",      // Buvette - French bistro, not African/Caribbean focus
  "phi-aksum",        // Aksum Cafe - Mediterranean/New American, hookah; not African focus
];

const REMOVE_IDS = new Set([
  ...PERMANENTLY_CLOSED,
  ...NO_PROPER_ADDRESS,
  ...NON_ALIGNED,
]);

const removed = data.filter((r) => REMOVE_IDS.has(r.id));
const kept = data.filter((r) => !REMOVE_IDS.has(r.id));

console.log("Removing", removed.length, "restaurants:");
removed.forEach((r) => console.log("  -", r.id, "|", r.name));
console.log("\nKeeping", kept.length, "restaurants.");

writeFileSync(dataPath, JSON.stringify(kept, null, 2), "utf8");
console.log("\nUpdated", dataPath);
