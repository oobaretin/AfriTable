#!/usr/bin/env node
/**
 * Merges data/serpapi-all-cities-restaurants.json into data/restaurants.json
 * (AfriTable catalog shape). Dedupes by normalized full address line and `google_place_id`.
 * Fixes wrong `state: TX` from SerpAPI formatter using ZIP / city heuristics.
 *
 * Run: node scripts/merge-serpapi-into-restaurants-json.mjs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, "data", "restaurants.json");
const SERP = path.join(ROOT, "data", "serpapi-all-cities-restaurants.json");

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Single-line address compare (street + zip usually enough across catalogs). */
function normalizeAddressLine(addr) {
  return String(addr || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function inferState(city, zip, serpState) {
  const z3 = parseInt(String(zip || "").replace(/\D/g, "").slice(0, 3), 10);
  if (Number.isFinite(z3)) {
    if (z3 >= 850 && z3 <= 865) return "AZ";
    if (z3 >= 900 && z3 <= 966) return "CA";
    if (z3 >= 550 && z3 <= 567) return "MN";
    if (z3 >= 970 && z3 <= 978) return "OR";
    if (z3 >= 370 && z3 <= 385) return "TN";
  }
  const c = String(city || "").toLowerCase();
  const az = new Set(["phoenix", "mesa", "tempe", "scottsdale", "chandler", "gilbert", "glendale", "peoria", "surprise"]);
  const ca = new Set(["riverside", "corona", "moreno valley", "san bernardino", "fontana", "ontario", "colton", "rancho cucamonga", "murrieta", "redlands", "rialto"]);
  if (az.has(c)) return "AZ";
  if (ca.has(c)) return "CA";
  if (c === "minneapolis" || c === "saint paul" || c === "st. paul") return "MN";
  if (c === "portland") return "OR";
  if (c === "nashville") return "TN";
  if (serpState && serpState.length === 2 && serpState !== "TX") return serpState;
  return "AZ";
}

function priceNumToStr(n) {
  const m = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
  return m[Number(n)] || "$$";
}

function inferRegion(cuisineTypes) {
  const t = (cuisineTypes || []).join(" ").toLowerCase();
  if (/jamaican|trinidadian|haitian|caribbean/.test(t)) return "Caribbean";
  if (/nigerian|ghanaian|senegalese|liberian|west african/.test(t)) return "West African";
  if (/ethiopian|eritrean|somali|kenyan|east african/.test(t)) return "East African";
  if (/south african/.test(t)) return "Southern African";
  return "African";
}

function primaryCuisine(cuisineTypes) {
  const [first] = cuisineTypes || [];
  if (first && first !== "African") return first;
  return "African";
}

/** Serp formatter often hardcodes "Houston" in blurbs; swap to actual city when state is not TX. */
function cleanDescription(desc, city, state) {
  let s = String(desc || "").trim();
  if (!s) return s;
  if (state !== "TX" && /\bHouston\b/i.test(s) && city) {
    s = s.replace(/\bHouston\b/gi, city);
  }
  return s.slice(0, 500);
}

function hoursToSimple(h) {
  if (!h || typeof h !== "object") return { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" };
  const mon = h.monday;
  if (mon && !mon.closed && mon.open && mon.close) {
    return { mon_sat: `${mon.open} - ${mon.close} (confirm)`, sun: "Varies" };
  }
  return { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" };
}

function serpRowToCatalog(r, usedIds) {
  const a = r.address || {};
  const state = inferState(a.city, a.zip, a.state);
  const street = String(a.street || "").trim();
  const city = String(a.city || "").trim();
  const zip = String(a.zip || "").replace(/\D/g, "").slice(0, 5);
  const address = `${street}, ${city}, ${state} ${zip}`.replace(/^,\s*/, "");

  let id = slugify(`${r.name}-${city}`);
  if (!id) id = `serpapi-${crypto.randomBytes(4).toString("hex")}`;
  let base = id;
  let n = 0;
  while (usedIds.has(id)) {
    n++;
    id = `${base}-${n}`;
  }
  usedIds.add(id);

  return {
    id,
    name: String(r.name || "").trim(),
    cuisine: primaryCuisine(r.cuisine_types),
    region: inferRegion(r.cuisine_types),
    price_range: priceNumToStr(r.price_range),
    rating: typeof r.google_rating === "number" ? r.google_rating : 4.2,
    address,
    phone: r.phone || undefined,
    website: r.website || undefined,
    hours: hoursToSimple(r.hours),
    about:
      cleanDescription(
        r.description || `${r.name} — discovered via SerpAPI batch.`,
        city,
        state,
      ) || `${r.name} — discovered via SerpAPI batch.`.slice(0, 500),
    our_story: "Listing sourced from public maps data; verify hours and menu before publishing.",
    cultural_roots: "Diaspora dining in the United States.",
    menu_highlights: ["Call for seasonal specials"],
    vibe_category: "Authentic Staples",
    state,
    ...(r.google_place_id ? { google_place_id: r.google_place_id } : {}),
    ...(a.coordinates?.lat != null ? { lat: a.coordinates.lat, lng: a.coordinates.lng } : {}),
  };
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  if (!Array.isArray(catalog)) throw new Error("restaurants.json must be an array");

  const serp = JSON.parse(fs.readFileSync(SERP, "utf8"));
  if (!Array.isArray(serp)) throw new Error("serpapi-all-cities-restaurants.json must be an array");

  const usedIds = new Set(catalog.map((r) => r.id).filter(Boolean));
  const seenAddresses = new Set(catalog.map((r) => normalizeAddressLine(r.address)));
  const seenPlaceIds = new Set(
    catalog.map((r) => r.google_place_id).filter(Boolean),
  );

  let added = 0;
  let skipped = 0;

  for (const row of serp) {
    const pid = row.google_place_id;
    if (pid && seenPlaceIds.has(pid)) {
      skipped++;
      continue;
    }

    const a = row.address || {};
    const state = inferState(a.city, a.zip, a.state);
    const street = String(a.street || "").trim();
    const city = String(a.city || "").trim();
    const zip = String(a.zip || "").replace(/\D/g, "").slice(0, 5);
    const fullLine = normalizeAddressLine(`${street}, ${city}, ${state} ${zip}`);

    if (!street || !city) {
      skipped++;
      continue;
    }
    if (seenAddresses.has(fullLine)) {
      skipped++;
      continue;
    }

    const rec = serpRowToCatalog(row, usedIds);
    const recLine = normalizeAddressLine(rec.address);
    seenAddresses.add(recLine);
    if (rec.google_place_id) seenPlaceIds.add(rec.google_place_id);
    catalog.push(rec);
    added++;
  }

  fs.writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Merged SerpAPI batch into ${CATALOG}`);
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (dedupe / empty): ${skipped}`);
  console.log(`  Total restaurants now: ${catalog.length}`);
  console.log(`\nNext: node scripts/normalize-vibe-categories.mjs`);
}

main();
