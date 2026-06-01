#!/usr/bin/env node
/**
 * Append DB listings not in catalog (legacy Serp slugs) to data/restaurants.json.
 * Sets sources.catalog_id on DB rows to match slug.
 * Usage: node scripts/sync-legacy-to-catalog.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(n) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

function parseAddressLine(addr) {
  const s = String(addr || "").trim();
  const m = s.match(/^(.+),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})/);
  if (m) return { street: m[1].trim(), city: m[2].trim(), state: m[3], zip: m[4] };
  return null;
}

function catalogFingerprint(c) {
  return addressFingerprintFromObj(parseAddressLine(c.address));
}

function addressFingerprintFromObj(a) {
  if (!a || typeof a !== "object") return "";
  const street = String(a.street || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 48);
  const zip = String(a.zip || "")
    .replace(/\D/g, "")
    .slice(0, 5);
  const city = String(a.city || "").toLowerCase().trim();
  if (!street || !city) return "";
  return `${street}|${zip}|${city}`;
}

function priceNumToStr(n) {
  const p = Math.min(4, Math.max(1, Number(n) || 2));
  return "$".repeat(p);
}

function dbRowToCatalog(r) {
  const a = r.address || {};
  const state = String(a.state || "").trim();
  const zip = String(a.zip || "").replace(/\D/g, "").slice(0, 5);
  const city = String(a.city || "").trim();
  const street = String(a.street || "").trim();
  if (!street || !city || !state) return null;

  const cuisine = Array.isArray(r.cuisine_types) ? r.cuisine_types[0] : "African";
  const region = Array.isArray(r.cuisine_types) ? r.cuisine_types[1] : "African";

  return {
    id: r.slug,
    name: r.name,
    cuisine: cuisine || "African",
    region: region || "African",
    price_range: priceNumToStr(r.price_range),
    rating: typeof r.external_avg_rating === "number" ? r.external_avg_rating : 4.2,
    address: `${street}, ${city}, ${state} ${zip}`,
    phone: r.phone || undefined,
    website: r.website || undefined,
    hours: { mon_sat: "11:00 AM - 9:00 PM (confirm)", sun: "Varies" },
    about: r.description || `${r.name} — AfriTable listing.`,
    our_story:
      r.our_story ||
      "Listing synced from verified public data; contact the restaurant to confirm hours and menu.",
    cultural_roots: r.cultural_roots || "Diaspora dining in the United States.",
    menu_highlights: r.menu?.highlights || ["Call for seasonal specials"],
    vibe_category: "Authentic Staples",
    state,
    ...(r.sources?.google_place_id ? { google_place_id: r.sources.google_place_id } : {}),
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const catalogPath = path.join(process.cwd(), "data", "restaurants.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const catalogIds = new Set(catalog.map((c) => c.id));
  const fpSeen = new Set(catalog.map((c) => catalogFingerprint(c)).filter(Boolean));

  const { data: rows } = await supabase
    .from("restaurants")
    .select(
      "id,slug,name,cuisine_types,price_range,address,phone,website,description,our_story,cultural_roots,menu,sources,external_avg_rating,is_active",
    )
    .eq("is_active", true);

  const legacy = (rows ?? []).filter(
    (r) => !catalogIds.has(r.slug) && !catalogIds.has(r.sources?.catalog_id),
  );

  const added = [];
  let skipped = 0;

  for (const r of legacy) {
    const fp = addressFingerprintFromObj(r.address);
    if (fp && fpSeen.has(fp)) {
      skipped++;
      continue;
    }
    const entry = dbRowToCatalog(r);
    if (!entry) {
      skipped++;
      continue;
    }
    catalog.push(entry);
    catalogIds.add(entry.id);
    if (fp) fpSeen.add(fp);
    added.push(entry.id);

    if (!dryRun) {
      await supabase
        .from("restaurants")
        .update({
          sources: { ...(r.sources || {}), catalog_id: r.slug, catalog: true },
        })
        .eq("id", r.id);
    }
  }

  if (!dryRun && added.length) {
    fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  }

  console.log(dryRun ? "DRY RUN — legacy → catalog" : "Legacy → catalog sync");
  console.log(`  Legacy rows scanned: ${legacy.length}`);
  console.log(`  Added to catalog:    ${added.length}`);
  console.log(`  Skipped (dup FP):    ${skipped}`);
  if (added.length && !dryRun) console.log(`  Catalog total:       ${catalog.length}`);
  if (added.length <= 15) added.forEach((id) => console.log(`    + ${id}`));
  else added.slice(0, 10).forEach((id) => console.log(`    + ${id}`));
  if (added.length > 10) console.log(`    … and ${added.length - 10} more`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
