#!/usr/bin/env node
/**
 * Fix known wrong addresses, remove verified closed/duplicate listings,
 * and restore legitimate multi-location entries removed by name dedupe.
 *
 * Run: node scripts/fix-catalog-integrity.mjs
 */

import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "restaurants.json");
const logPath = join(__dirname, "..", ".cursor", "debug-3435b4.log");
const sessionId = "3435b4";

function auditLog(message, data, hypothesisId = "catalog") {
  const line = JSON.stringify({
    sessionId,
    runId: "catalog-fix",
    hypothesisId,
    location: "fix-catalog-integrity.mjs",
    message,
    data,
    timestamp: Date.now(),
  });
  try {
    appendFileSync(logPath, line + "\n");
  } catch {
    // log path may not exist in CI
  }
}

/** Permanently closed or invalid listings (verified via public sources). */
const REMOVE_IDS = new Set([
  "hou-sta-013", // Jollof Rice King — permanently closed (3833 Richmond Ave)
  "tailat-kitchen-austin", // Wrong Pflugerville address; real location is Westminster Dr
  "lucy-houston", // Duplicate of hou-sta-017 (Lucy Ethiopian Restaurant & Lounge)
  "sarabell-calabar-restaurant-buffet-houston", // Duplicate of hou-sta-004 (same address/phone)
]);

const ADDRESS_FIXES = {
  "hou-sta-008": {
    address: "9625 Bissonnet St, Houston, TX 77036",
    phone: "(713) 773-1400",
    google_search_url:
      "https://www.google.com/search?q=Afrikiko%2C%209625%20Bissonnet%20St%2C%20Houston%2C%20TX%2077036",
  },
  "hou-sta-016": {
    address: "10023 S Main St Bldg 7, Houston, TX 77025",
    phone: "(512) 840-0855",
    website: "http://www.fabaceaecuisine.com",
    google_search_url:
      "https://www.google.com/search?q=Fabaceae%20African%20Cuisine%2C%2010023%20S%20Main%20St%20Bldg%207%2C%20Houston%2C%20TX%2077025",
  },
  "hou-sta-004": {
    address: "9801 Bissonnet St Ste C, Houston, TX 77036",
    phone: "(713) 814-5253",
    google_search_url:
      "https://www.google.com/search?q=Sarabell%20Calabar%2C%209801%20Bissonnet%20St%20Ste%20C%2C%20Houston%2C%20TX%2077036",
  },
  "hou-005": {
    address: "14144 Westheimer Rd #120, Houston, TX 77077",
    zip: "77077",
    lat: 29.7355,
    lng: -95.602,
    phone: "(281) 741-3571",
    google_search_url:
      "https://www.google.com/search?q=Komchop%2C%2014144%20Westheimer%20Rd%20%23120%2C%20Houston%2C%20TX%2077077",
  },
  "tailat-kitchen-nigerian-cuisine-austin": {
    name: "Tailat Kitchen",
    address: "5933 Westminster Dr, Austin, TX 78723",
    phone: "(512) 809-4839",
    google_search_url:
      "https://www.google.com/search?q=Tailat%20Kitchen%2C%205933%20Westminster%20Dr%2C%20Austin%2C%20TX%2078723",
  },
  "hou-sta-017": {
    address: "6800 Southwest Fwy Suite D, Houston, TX 77074",
    zip: "77074",
    phone: "(713) 334-0000",
    google_search_url:
      "https://www.google.com/search?q=Lucy%20Ethiopian%20Restaurant%20%26%20Lounge%2C%206800%20Southwest%20Fwy%2C%20Houston%2C%20TX%2077074",
  },
};

const RESTORE_ENTRIES = [
  {
    id: "chopnblok-montrose-houston",
    name: "ChòpnBlọk (Montrose)",
    cuisine: "West African (Fast-Fine)",
    region: "West African",
    price_range: "$$$",
    rating: 4.6,
    address: "507 Westheimer Rd, Houston, TX 77006",
    zip: "77006",
    phone: "(832) 962-4500",
    website: "https://chopnblok.co",
    neighborhood: "Montrose",
    hours: {
      mon_sat: "11:00 AM - 9:00 PM",
      sun: "Closed",
    },
    vibe: "Modern & High-Design",
    vibe_tags: ["Modern & High-Design"],
    specialty: "Trad Bowl (Jollof) & Yassa Grill",
    menu_highlights: ["Trad Bowl (Jollof)", "Yassa Grill"],
    vibe_category: "Authentic Staples",
    about:
      "Montrose location of ChòpnBlọk — fast-fine West African bowls, suya, and cocktails.",
    state: "TX",
    google_search_url:
      "https://www.google.com/search?q=Ch%C3%B2pnBl%E1%BB%8Dk%2C%20507%20Westheimer%20Rd%2C%20Houston%2C%20TX%2077006",
    images: ["/restaurant-card-placeholder.svg"],
  },
  {
    id: "adulis-houston",
    name: "Adulis",
    cuisine: "Eritrean",
    region: "East African",
    price_range: "$$",
    rating: 4.8,
    address: "5800 Bellaire Blvd #102, Houston, TX 77081",
    phone: "(346) 571-0966",
    hours: {
      mon_sat: "10:00 AM - 2:00 AM",
      sun: "5:00 PM - 2:00 AM",
    },
    about:
      "Family-owned Eritrean and Ethiopian restaurant on Bellaire Blvd; injera platters, tibs, and late-night dining.",
    vibe_category: "Authentic Staples",
    state: "TX",
    google_search_url:
      "https://www.google.com/search?q=Adulis%2C%205800%20Bellaire%20Blvd%20%23102%2C%20Houston%2C%20TX%2077081",
    images: ["/restaurant-card-placeholder.svg"],
  },
];

function main() {
  const data = JSON.parse(readFileSync(dataPath, "utf8"));
  const beforeCount = data.length;

  auditLog("catalog audit start", { beforeCount, removeIds: [...REMOVE_IDS] });

  const removed = [];
  let kept = data.filter((r) => {
    if (REMOVE_IDS.has(r.id)) {
      removed.push({ id: r.id, name: r.name, address: r.address, reason: "closed_or_invalid" });
      return false;
    }
    return true;
  });

  const fixed = [];
  kept = kept.map((r) => {
    const patch = ADDRESS_FIXES[r.id];
    if (!patch) return r;
    fixed.push({ id: r.id, name: r.name, before: r.address, after: patch.address ?? r.address });
    return { ...r, ...patch };
  });

  const existingIds = new Set(kept.map((r) => r.id));
  const restored = [];
  for (const entry of RESTORE_ENTRIES) {
    if (existingIds.has(entry.id)) continue;
    kept.push(entry);
    restored.push({ id: entry.id, name: entry.name, address: entry.address });
    existingIds.add(entry.id);
  }

  writeFileSync(dataPath, JSON.stringify(kept, null, 2) + "\n", "utf8");

  auditLog("catalog audit complete", {
    beforeCount,
    afterCount: kept.length,
    removed,
    fixed,
    restored,
  });

  console.log("Catalog integrity fix");
  console.log(`  Before: ${beforeCount}`);
  console.log(`  After:  ${kept.length}`);
  console.log(`  Removed (${removed.length}):`);
  removed.forEach((r) => console.log(`    - ${r.id} | ${r.name}`));
  console.log(`  Address fixes (${fixed.length}):`);
  fixed.forEach((r) => console.log(`    - ${r.id}: ${r.before} → ${r.after}`));
  console.log(`  Restored (${restored.length}):`);
  restored.forEach((r) => console.log(`    + ${r.id} | ${r.name}`));
}

main();
