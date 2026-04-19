#!/usr/bin/env node
/**
 * Appends curated Afro-Caribbean listings for metros that were empty in the catalog
 * (Phoenix, Inland Empire). Dedupes by `id`.
 * Run after: node scripts/normalize-vibe-categories.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "data", "restaurants.json");

/** Verified-style public info — expand via SerpAPI scrape + owner onboarding over time */
const APPEND = [
  {
    id: "abyssinia-phoenix",
    name: "Abyssinia Restaurant and Cafe",
    cuisine: "Ethiopian",
    region: "East African",
    price_range: "$$",
    rating: 4.5,
    address: "842 E Indian School Rd, Phoenix, AZ 85014",
    phone: "(602) 795-4113",
    website: "https://ethiopianrestaurantinphoenixaz.com",
    hours: {
      mon_sat: "10:00 AM - 10:00 PM",
      sun: "1:00 PM - 10:00 PM",
    },
    about: "Classic Ethiopian plates, injera, and vegan options in central Phoenix.",
    our_story: "Serving the Valley with traditional recipes and Ethiopian coffee ceremony.",
    cultural_roots: "Habesha hospitality and shared platters.",
    menu_highlights: ["Doro wat", "Veggie combo", "Tibs"],
    vibe_category: "Authentic Staples",
    state: "AZ",
  },
  {
    id: "authentic-ethio-mcdowell-phoenix",
    name: "Authentic Ethio African Kitchen & Bar",
    cuisine: "Ethiopian",
    region: "East African",
    price_range: "$$",
    rating: 4.6,
    address: "1740 E McDowell Rd, Phoenix, AZ 85006",
    phone: "(602) 252-2286",
    hours: {
      mon_sun: "11:00 AM - 9:00 PM",
    },
    about: "Ethiopian kitchen and bar near the heart of Phoenix with takeout and delivery.",
    our_story: "Focused on spice-forward stews and fresh injera for the downtown corridor.",
    cultural_roots: "East African comfort food for the diaspora community.",
    menu_highlights: ["Kitfo", "Lamb tibs", "Shiro"],
    vibe_category: "Authentic Staples",
    state: "AZ",
  },
  {
    id: "ethiopian-famous-tempe",
    name: "Ethiopian Famous Restaurant",
    cuisine: "Ethiopian",
    region: "East African",
    price_range: "$$",
    rating: 4.4,
    address: "933 E University Dr #112, Tempe, AZ 85288",
    hours: {
      mon_sun: "11:00 AM - 9:00 PM",
    },
    about: "Tempe-area Ethiopian spot known for vegetarian combos and hearty meat stews.",
    our_story: "Carrying Habesha flavors for students and families near ASU.",
    cultural_roots: "Shared injera platters and bold berbere seasoning.",
    menu_highlights: ["Veggie combo", "Beef tibs", "Sambusa"],
    vibe_category: "Authentic Staples",
    state: "AZ",
  },
  {
    id: "island-breeze-colton",
    name: "Island Breeze Jamaican Cuisine",
    cuisine: "Jamaican",
    region: "Caribbean",
    price_range: "$$",
    rating: 4.5,
    address: "1063 S Mount Vernon Ave, Colton, CA 92324",
    phone: "(909) 514-0771",
    website: "https://www.ibjamaicancuisine.com",
    hours: {
      mon_sat: "11:00 AM - 8:00 PM",
      sun: "Closed",
    },
    about: "Inland Empire Jamaican kitchen with jerk, oxtail, and island sides.",
    our_story: "Family-run recipes bringing Kingston-style heat to Colton.",
    cultural_roots: "Caribbean soul food for community gatherings.",
    menu_highlights: ["Jerk chicken", "Curry goat", "Oxtail"],
    vibe_category: "Authentic Staples",
    state: "CA",
  },
  {
    id: "island-breeze-san-bernardino",
    name: "Island Breeze Jamaican Cuisine (San Bernardino)",
    cuisine: "Jamaican",
    region: "Caribbean",
    price_range: "$$",
    rating: 4.4,
    address: "763 W Highland Ave, San Bernardino, CA 92405",
    hours: {
      mon_wed: "11:00 AM - 6:00 PM",
      thu_sat: "11:00 AM - 6:30 PM",
    },
    about: "Second location serving classic Jamaican plates and lunch specials.",
    our_story: "Same island flavors for San Bernardino and Riverside County diners.",
    cultural_roots: "Roots cooking with spice and patience.",
    menu_highlights: ["Brown stew chicken", "Curry shrimp", "Plantains"],
    vibe_category: "Authentic Staples",
    state: "CA",
  },
];

function main() {
  const raw = fs.readFileSync(ROOT, "utf8");
  const existing = JSON.parse(raw);
  const ids = new Set(existing.map((r) => r.id));
  let added = 0;
  for (const row of APPEND) {
    if (ids.has(row.id)) continue;
    existing.push(row);
    ids.add(row.id);
    added++;
  }
  fs.writeFileSync(ROOT, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  console.log(`Appended ${added} new restaurants (${APPEND.length - added} duplicates skipped). Total: ${existing.length}`);
}

main();
