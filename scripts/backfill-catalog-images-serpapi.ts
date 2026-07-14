#!/usr/bin/env tsx
/**
 * Backfill restaurant photos in data/restaurants.json via SerpAPI place lookups.
 * Only processes entries that already have google_place_id and placeholder/missing images.
 *
 * Each restaurant = 1 SerpAPI search (photos are bundled in the place response).
 *
 * Usage:
 *   npm run backfill:images
 *   npm run backfill:images -- --limit 25 --photos 3
 *   npm run backfill:images -- --dry-run --limit 5
 *
 * No npm/node? Use: python3 scripts/backfill-catalog-images-serpapi.py
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { getJson } from "serpapi";

config({ path: path.join(process.cwd(), ".env.local") });

const CATALOG_PATH = path.join(process.cwd(), "data", "restaurants.json");
const REPORT_PATH = path.join(process.cwd(), "data", "backfill-images-report.json");

const BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg";
const LEGACY_PLACEHOLDER = "/og-image.svg";
const STOCK_PREFIX = "https://images.unsplash.com/";

type CatalogEntry = {
  id: string;
  name: string;
  google_place_id?: string;
  images?: string[];
};

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  let limit = 25;
  let photos = 3;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) {
      limit = Math.max(1, parseInt(argv[i + 1], 10) || limit);
      i++;
    } else if (argv[i] === "--photos" && argv[i + 1]) {
      photos = Math.min(10, Math.max(1, parseInt(argv[i + 1], 10) || photos));
      i++;
    }
  }

  return { dryRun, limit, photos };
}

function hasRealImages(images: string[] | undefined): boolean {
  if (!Array.isArray(images) || images.length === 0) return false;
  return images.some((raw) => {
    const url = String(raw ?? "").trim();
    if (!url) return false;
    if (url === BRAND_PLACEHOLDER || url === LEGACY_PLACEHOLDER) return false;
    if (url.endsWith("/restaurant-card-placeholder.svg") || url.endsWith("/og-image.svg")) return false;
    if (url.startsWith(STOCK_PREFIX)) return false;
    return true;
  });
}

function extractPhotoUrls(details: unknown, maxPhotos: number): string[] {
  const root = details as {
    photos?: Array<{ thumbnail?: string; image?: string }>;
    place_results?: {
      thumbnail?: string;
      images?: Array<{ title?: string; thumbnail?: string; image?: string }>;
    };
  } | null;

  const urls: string[] = [];
  const push = (raw: string | undefined) => {
    const url = String(raw ?? "").trim();
    if (!url || urls.includes(url)) return;
    urls.push(url);
  };

  const place = root?.place_results;
  if (place?.thumbnail) push(place.thumbnail);

  for (const img of place?.images ?? []) {
    if (img?.title === "All") continue;
    push(img?.thumbnail || img?.image);
    if (urls.length >= maxPhotos) return urls.slice(0, maxPhotos);
  }

  for (const photo of root?.photos ?? []) {
    push(photo?.thumbnail || photo?.image);
    if (urls.length >= maxPhotos) return urls.slice(0, maxPhotos);
  }

  return urls.slice(0, maxPhotos);
}

async function fetchPlaceDetails(placeId: string) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not set");

  try {
    return await getJson({
      engine: "google_maps",
      type: "place",
      place_id: placeId,
      api_key: apiKey,
    });
  } catch (error) {
    console.error("SerpAPI place lookup error:", error);
    return null;
  }
}

async function main() {
  const { dryRun, limit, photos } = parseArgs(process.argv.slice(2));

  if (!process.env.SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY is not set. Add it to .env.local before running.");
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as CatalogEntry[];
  const candidates = catalog.filter(
    (r) => Boolean(r.google_place_id) && !hasRealImages(r.images),
  );

  const batch = candidates.slice(0, limit);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    limit,
    photosPerRestaurant: photos,
    catalogTotal: catalog.length,
    eligible: candidates.length,
    processed: 0,
    updated: 0,
    noPhotos: 0,
    failed: 0,
    serpSearchesUsed: 0,
    details: [] as Array<{
      id: string;
      name: string;
      google_place_id: string;
      status: "updated" | "no_photos" | "failed";
      imageCount: number;
    }>,
  };

  console.log("SerpAPI image backfill\n");
  console.log(`  Eligible (place_id + placeholder): ${candidates.length}`);
  console.log(`  This run:                        ${batch.length} (limit ${limit})`);
  console.log(`  Photos per restaurant:           ${photos}`);
  console.log(`  Est. SerpAPI searches:           ~${batch.length}`);
  console.log(`  Dry run:                         ${dryRun ? "yes" : "no"}\n`);

  if (batch.length === 0) {
    console.log("Nothing to backfill.");
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    return;
  }

  for (let i = 0; i < batch.length; i++) {
    const entry = batch[i];
    const placeId = entry.google_place_id!;
    console.log(`${i + 1}/${batch.length}: ${entry.name}`);

    report.processed++;
    report.serpSearchesUsed++;

    try {
      const details = await fetchPlaceDetails(placeId);
      const urls = extractPhotoUrls(details, photos);

      if (urls.length === 0) {
        report.noPhotos++;
        report.details.push({
          id: entry.id,
          name: entry.name,
          google_place_id: placeId,
          status: "no_photos",
          imageCount: 0,
        });
        console.log("  → no photos returned");
      } else {
        entry.images = urls;
        report.updated++;
        report.details.push({
          id: entry.id,
          name: entry.name,
          google_place_id: placeId,
          status: "updated",
          imageCount: urls.length,
        });
        console.log(`  → saved ${urls.length} photo(s)`);
      }
    } catch (error) {
      report.failed++;
      report.details.push({
        id: entry.id,
        name: entry.name,
        google_place_id: placeId,
        status: "failed",
        imageCount: 0,
      });
      console.log(`  → failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (i < batch.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  if (!dryRun && report.updated > 0) {
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
    console.log(`\nWrote ${CATALOG_PATH}`);
  } else if (dryRun) {
    console.log("\nDry run — catalog not written");
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("\nSummary");
  console.log(`  Updated:     ${report.updated}`);
  console.log(`  No photos:   ${report.noPhotos}`);
  console.log(`  Failed:      ${report.failed}`);
  console.log(`  Searches:    ${report.serpSearchesUsed}`);
  console.log(`  Remaining:   ${Math.max(0, candidates.length - batch.length)} eligible`);
  console.log(`  Report:      ${REPORT_PATH}`);

  if (candidates.length > batch.length) {
    console.log(`\nNext batch: npm run backfill:images:py -- --limit ${limit}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
