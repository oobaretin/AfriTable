#!/usr/bin/env tsx
/**
 * Ensure every catalog restaurant has google_search_url (google.com/search, not Maps).
 * Run: npm run backfill:google-search
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { resolveGoogleSearchUrl } from "../src/lib/google-search-url";

config({ path: path.join(process.cwd(), ".env.local") });

const CATALOG_PATH = path.join(process.cwd(), "data", "restaurants.json");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as any[];

  let updated = 0;

  for (const entry of catalog) {
    const prev = entry.google_search_url;
    entry.google_search_url = resolveGoogleSearchUrl(entry);
    if (entry.google_search_url !== prev) updated++;
    delete entry.google_maps_url;
  }

  if (!dryRun) {
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  }

  console.log("Google.com search link backfill");
  console.log(`  Total restaurants: ${catalog.length}`);
  console.log(`  Links updated:     ${updated}`);
  console.log(`  Sample:            ${catalog[0]?.google_search_url?.slice(0, 72)}…`);
  if (dryRun) console.log("\nDRY RUN — catalog not written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
