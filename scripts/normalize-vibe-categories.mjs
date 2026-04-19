#!/usr/bin/env node
/**
 * Ensures every restaurant has a valid vibe_category for site filters.
 * Run: node scripts/normalize-vibe-categories.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "data", "restaurants.json");

const VALID = new Set(["Fine Dining", "Authentic Staples", "Community Favorites"]);

/** Exact IDs that need human-intent assignments */
const BY_ID = {
  "two-hommes-inglewood": "Fine Dining",
  "komchop-houston": "Community Favorites",
  "aduke-nigerian-la": "Authentic Staples",
  "ts-buka-arlington": "Authentic Staples",
  "tailat-kitchen-austin": "Authentic Staples",
  "lady-t-kitchen-austin": "Authentic Staples",
  "bamboo-walk-brooklyn": "Authentic Staples",
  "cocobreeze-oakland": "Authentic Staples",
  "blackstar-kebab-seattle": "Authentic Staples",
  "48th-street-grille-philly": "Authentic Staples",
  "tsehay-dc": "Authentic Staples",
  "feru-ethiopian-dc": "Authentic Staples",
  "little-lagos-atl": "Authentic Staples",
  "baba-jollof-houston": "Authentic Staples",
  "native-pot-houston": "Authentic Staples",
  "vees-brooklyn": "Authentic Staples",
  "irie-caribbean-brooklyn": "Authentic Staples",
  "tesfa-ethiopian-chicago": "Authentic Staples",
  "badou-senegalese-chicago": "Authentic Staples",
  "blessed-tropical-inglewood": "Authentic Staples",
  "selam-ethiopian-chicago": "Authentic Staples",
};

/** Optional vibe text so "Daily Driver" filter matches real quick-service gems */
const VIBE_DAILY_DRIVER_NOTE = {
  "vees-brooklyn":
    "Casual counter-service Jamaican — patties, bowls, and platters locals use as a daily driver spot.",
  "komchop-houston":
    "Fast-casual Nigerian bowls and mains — easy daily driver pick for Houston.",
};

function inferCategory(r) {
  const id = r.id;
  if (BY_ID[id]) return BY_ID[id];

  const cat = r.vibe_category;
  if (VALID.has(cat)) return cat;

  const raw = (r.vibe || "").trim();
  if (VALID.has(raw)) return raw;

  const cuisine = `${r.cuisine || ""} ${r.about || ""}`.toLowerCase();
  const price = r.price_range || "";

  if (/fusion|tasting menu|fine dining|michelin|chef.?s table|elevated/i.test(cuisine)) return "Fine Dining";
  if (/\$\$\$|\$\$\$\$/.test(price) && !/street|market/i.test(cuisine)) return "Fine Dining";
  if (/community|beloved|neighborhood institution|busy local/i.test(cuisine)) return "Community Favorites";

  return "Authentic Staples";
}

function main() {
  const raw = fs.readFileSync(ROOT, "utf8");
  const list = JSON.parse(raw);
  let changed = 0;

  for (const r of list) {
    const next = inferCategory(r);
    if (r.vibe_category !== next) {
      r.vibe_category = next;
      changed++;
    }
    const ddNote = VIBE_DAILY_DRIVER_NOTE[r.id];
    if (ddNote && !(r.vibe || "").toLowerCase().includes("daily driver")) {
      r.vibe = ddNote;
      changed++;
    }
  }

  fs.writeFileSync(ROOT, `${JSON.stringify(list, null, 2)}\n`, "utf8");
  console.log(`Updated ${ROOT} (${changed} field updates applied).`);
}

main();
