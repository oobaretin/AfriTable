#!/usr/bin/env node
/**
 * Build a safe Supabase import batch from catalog + SerpAPI data.
 * - Skips slugs already in `restaurants` (any is_active).
 * - Skips slug collisions with active curated rows.
 * Writes:
 *   data/import-dry-run.json   (audit)
 *   data/serpapi-import-safe.json (input for npm run import:json)
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function importSlugForCatalogRow(r) {
  const addr = parseAddressLine(r.address);
  return `${slugify(r.name)}-${slugify(addr.city)}`;
}

function parseAddressLine(addr) {
  const s = String(addr || "").trim();
  const m = s.match(/^(.+),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})/);
  if (m) return { street: m[1].trim(), city: m[2].trim(), state: m[3], zip: m[4] };
  const parts = s.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return { street: parts[0], city: parts[1], state: parts[2]?.slice(0, 2) || "", zip: "" };
  }
  return { street: s, city: "", state: "", zip: "" };
}

function priceStrToNum(pr) {
  const n = (String(pr || "").match(/\$/g) || []).length;
  return Math.min(4, Math.max(1, n || 2));
}

function catalogToImportRow(r) {
  const address = parseAddressLine(r.address);
  const cuisine = r.cuisine || "African";
  return {
    name: r.name,
    cuisine_types: [cuisine, r.region].filter(Boolean),
    address,
    phone: r.phone || "000-000-0000",
    website: r.website || undefined,
    description: r.about || `${r.name} — AfriTable listing.`,
    price_range: priceStrToNum(r.price_range),
    hours: r.hours || {},
    google_rating: typeof r.rating === "number" ? r.rating : undefined,
    sources: {
      serpapi: true,
      catalog_id: r.id,
      ...(r.google_place_id ? { google_place_id: r.google_place_id } : {}),
    },
  };
}

function serpToImportRow(r) {
  const a = r.address || {};
  return {
    name: r.name,
    cuisine_types: Array.isArray(r.cuisine_types) ? r.cuisine_types : ["African"],
    address: {
      street: a.street || "",
      city: a.city || "",
      state: a.state || "",
      zip: a.zip || "",
      ...(a.coordinates ? { coordinates: a.coordinates } : {}),
    },
    phone: r.phone || "000-000-0000",
    website: r.website,
    description: r.description || `${r.name} — SerpAPI discovery.`,
    price_range: Number(r.price_range) || 2,
    hours: r.hours || {},
    google_rating: r.google_rating,
    google_review_count: r.google_review_count,
    instagram: r.instagram,
    facebook: r.facebook,
    sources: { serpapi: true, ...(r.google_place_id ? { google_place_id: r.google_place_id } : {}) },
  };
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const { data: dbRows, error } = await supabase.from("restaurants").select("slug, is_active");
  if (error) throw error;

  const allSlugs = new Set((dbRows || []).map((r) => r.slug));
  const activeSlugs = new Set((dbRows || []).filter((r) => r.is_active).map((r) => r.slug));

  const catalogPath = path.join(process.cwd(), "data", "restaurants.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  const trulyNew = [];
  const slugCollisions = [];

  for (const r of catalog) {
    const catalogId = r.id;
    if (!catalogId) continue;
    const importSlug = importSlugForCatalogRow(r);
    if (allSlugs.has(catalogId) || allSlugs.has(importSlug)) continue;
    if (activeSlugs.has(catalogId) || activeSlugs.has(importSlug)) {
      slugCollisions.push({ name: r.name, slug: catalogId, import_slug: importSlug });
      continue;
    }
    const addr = parseAddressLine(r.address);
    if (!addr.street || !addr.city) continue;
    trulyNew.push({
      name: r.name,
      city: addr.city,
      slug: catalogId,
      import_slug: importSlug,
      catalog_id: catalogId,
    });
  }

  const importRows = catalog
    .filter((r) => trulyNew.some((t) => t.slug === r.id))
    .map(catalogToImportRow);

  const outDir = path.join(process.cwd(), "data");
  fs.writeFileSync(
    path.join(outDir, "import-dry-run.json"),
    JSON.stringify({ truly_new: trulyNew, slug_collisions: slugCollisions }, null, 2),
  );
  fs.writeFileSync(path.join(outDir, "serpapi-import-safe.json"), JSON.stringify(importRows, null, 2));

  console.log("Import dry-run");
  console.log(`  Catalog total:        ${catalog.length}`);
  console.log(`  DB slugs:             ${allSlugs.size} (${activeSlugs.size} active)`);
  console.log(`  Truly new (import):   ${trulyNew.length}`);
  console.log(`  Slug collisions:      ${slugCollisions.length}`);
  console.log(`  Wrote: data/serpapi-import-safe.json`);
  console.log(`  Next:  npm run import:json -- ./data/serpapi-import-safe.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
