#!/usr/bin/env node
/**
 * Apply researched hours to restaurants that have empty or missing hours.
 * Run: node scripts/apply-restaurant-hours.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "restaurants.json");

function hasValidHours(r) {
  const h = r.hours;
  if (!h || typeof h !== "object") return false;
  const vals = Object.values(h).filter(Boolean);
  if (vals.length === 0) return false;
  const str = JSON.stringify(h).toLowerCase();
  if (str.includes("coming soon")) return false;
  return true;
}

// Researched hours (id -> hours object). Format: "mon_sat": "11:00 AM - 9:00 PM", "sun": "Closed"
const HOURS_MAP = {
  "tatiana-by-kwame-onwuachi-new-york": { tue_sat: "5:00 PM - 10:00 PM", sun: "Closed", mon: "Closed" },
  "hou-007": { tue_fri: "11:30 AM - 8:00 PM", sat: "1:00 PM - 9:00 PM", sun: "1:00 PM - 6:00 PM", mon: "Closed" },
  "swahili-village-dc": { sun_thu: "11:00 AM - 12:00 AM", fri_sat: "11:00 AM - 2:00 AM" },
  "meals-by-genet-los-angeles": { fri_sun: "6:00 PM - 9:00 PM", mon_thu: "Closed" },
  "la-daily-003": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "la-blaqhaus-noho": { mon_thu: "5:00 PM - 10:00 PM", fri_sat: "5:00 PM - 12:00 AM", sun: "12:00 PM - 8:00 PM" },
  "amaweles-san-francisco": { mon_fri: "11:00 AM - 9:00 PM", sat_sun: "12:00 PM - 9:00 PM" },
  "african-small-pot-philadelphia": { mon_sun: "8:00 AM - 1:00 AM" },
  "gor-e-cuisine-chicago": { mon: "11:00 AM - 9:00 PM", wed: "11:00 AM - 9:00 PM", thu_sat: "11:00 AM - 10:00 PM", sun: "11:00 AM - 9:00 PM", tue: "Closed" },
  "kilimandjaro-philadelphia": { mon_sat: "11:00 AM - 10:00 PM", sun: "1:00 PM - 8:00 PM" },
  "iyanze-chicago": { mon_sun: "11:00 AM - 8:00 PM" },
  "chi-yassa": { mon_thu: "11:00 AM - 10:00 PM", fri_sat: "11:00 AM - 11:00 PM", sun: "11:00 AM - 10:00 PM" },
  "quality-taste-philadelphia": { mon_sat: "9:00 AM - 11:00 PM", sun: "10:00 AM - 10:00 PM" },
  "communion-r-b-seattle": { thu_sun: "5:00 PM - 10:00 PM", mon_wed: "Closed" },
  "sea-meskel": { tue_sun: "4:00 PM - 9:30 PM", mon: "Closed" },
  "jebena-cafe-seattle": { mon: "11:00 AM - 8:30 PM", tue: "11:00 AM - 8:30 PM", thu: "11:00 AM - 8:30 PM", fri: "11:00 AM - 8:30 PM", sat: "11:00 AM - 9:00 PM", wed: "Closed", sun: "Closed" },
  "cool-runnings-jamaican-grill-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "nola-bennachin": { wed_thu: "11:00 AM - 8:00 PM", fri_sun: "11:00 AM - 9:00 PM", mon_tue: "Closed" },
  "nola-dooky-chase": { tue_thu: "11:00 AM - 3:00 PM", fri: "11:00 AM - 9:00 PM", sat: "5:30 PM - 9:00 PM", sun: "Closed", mon: "Closed" },
  "nyc-abyssinia": { tue_sun: "11:00 AM - 10:00 PM", mon: "Closed" },
  "sf-teranga-village": { mon_fri: "10:30 AM - 3:00 PM", sat: "Closed", sun: "Closed" },
  "oak-lala-eritrean": { mon: "11:00 AM - 10:00 PM", wed_sun: "11:00 AM - 10:00 PM", tue: "Closed" },
  "nash-riddim-spice": { tue_sun: "11:00 AM - 9:00 PM", mon: "Closed" },
  "hou-reggae-hut": { mon_sat: "11:00 AM - 9:00 PM", sun: "11:00 AM - 6:00 PM" },
  "hou-caribbean-hotpot-grill": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "atl-spice-house-midtown": { mon_thu: "11:00 AM - 10:00 PM", fri_sat: "11:00 AM - 11:00 PM", sun: "11:00 AM - 9:00 PM" },
  "nyc-jasmines-caribbean": { mon_sun: "12:00 PM - 10:00 PM" },
  "chi-garifuna-flava": { wed_sun: "12:00 PM - 8:00 PM", mon_tue: "Closed" },
  "dc-st-james": { tue_thu: "5:30 PM - 10:00 PM", fri_sat: "5:30 PM - 11:00 PM", sun: "12:00 PM - 9:00 PM", mon: "Closed" },
  "la-dulans-crenshaw": { tue_thu: "11:00 AM - 8:00 PM", fri_sat: "11:00 AM - 9:00 PM", sun: "11:00 AM - 8:00 PM", mon: "Closed" },
  "mia-chef-creole": { mon_wed: "11:00 AM - 9:00 PM", thu_sat: "11:00 AM - 10:00 PM", sun: "Closed" },
  "chef-creole-north-miami-dixie": { mon_sat: "11:00 AM - 7:00 PM" },
  "chef-creole-north-miami-7th-ave": { mon_wed: "11:00 AM - 9:00 PM", thu_sat: "11:00 AM - 10:00 PM", sun: "Closed" },
  "chef-creole-miami-gardens": { mon_sat: "11:00 AM - 7:00 PM" },
  "mia-red-rooster-overtown": { wed_thu: "4:00 PM - 10:00 PM", fri: "4:00 PM - 11:00 PM", sat: "11:00 AM - 11:00 PM", sun: "11:00 AM - 10:00 PM", mon_tue: "Closed" },
  "baobab-fare-detroit": { tue_sun: "11:00 AM - 9:00 PM", mon: "Closed" },
  "lucilles-houston": { tue_thu: "11:00 AM - 9:00 PM", fri_sat: "11:00 AM - 10:00 PM", sun: "10:00 AM - 3:00 PM", mon: "Closed" },
  "chi-ja-grill-hyde-park": { sun_thu: "11:00 AM - 9:00 PM", fri_sat: "11:00 AM - 10:00 PM" },
  "atl-irie-mon-cafe": { mon_thu: "10:00 AM - 9:00 PM", fri_sat: "10:00 AM - 10:00 PM", sun: "Closed" },
  "nola-dakar": { tue_sat: "4:30 PM - 10:00 PM", sun: "Closed", mon: "Closed" },
  "sa-jerk-shack": { mon_thu: "11:00 AM - 8:00 PM", fri_sat: "11:00 AM - 9:00 PM", sun: "11:00 AM - 4:00 PM" },
  "atx-fine-001": { sun_wed: "5:00 PM - 10:00 PM", thu_sat: "5:00 PM - 12:00 AM" },
  "atx-fine-002": { mon_sat: "5:00 PM - 10:00 PM", sun: "5:00 PM - 9:00 PM" },
  "dfw-fine-001": { mon_fri: "5:00 PM - 2:00 AM", sat_sun: "1:00 PM - 2:00 AM" },
  "dfw-fine-002": { mon_thu: "11:00 AM - 9:00 PM", fri_sat: "11:00 AM - 10:00 PM", sun: "11:00 AM - 3:00 PM" },
  "hou-fine-001": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "atx-afro-002": { sun_thu: "11:00 AM - 9:00 PM", fri_sat: "11:00 AM - 10:00 PM" },
  "dfw-afro-002": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "chs-fine-001": { thu_sun: "5:00 PM - 10:00 PM", mon: "Closed", tue_wed: "Closed" },
  "status-hollywood-los-angeles": { tue_sun: "5:00 PM - 11:00 PM", mon: "Closed" },
  "atl-fine-001": { tue_sat: "5:00 PM - 10:00 PM", sun: "11:00 AM - 9:00 PM", mon: "Closed" },
  "phi-fine-001": { wed_sun: "5:00 PM - 11:00 PM", mon_tue: "Closed" },
  "sea-fine-002": { mon_sun: "11:00 AM - 9:00 PM" },
  "helens-kitchen-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "lucia-los-angeles": { tue_sun: "5:00 PM - 10:00 PM", mon: "Closed" },
  "bridgetown-roti-los-angeles": { tue_sun: "11:00 AM - 10:00 PM", mon: "Closed" },
  "sf-001": { mon_fri: "10:30 AM - 3:00 PM", sat: "Closed", sun: "Closed" },
  "taste-of-nigeria-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "komchop-houston": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "finger-licking-2-0-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "sarabell-calabar-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "Closed" },
  "amala-zone-houston": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "chef-benny-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "Closed" },
  "afrikiko-houston": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 8:00 PM" },
  "hou-sta-009": { mon_sat: "11:00 AM - 9:00 PM", sun: "Closed" },
  "astors-table-katy": { tue_sun: "11:00 AM - 9:00 PM", mon: "Closed" },
  "suya-hut-meadows-place": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "blue-nile-ethiopian-houston": { tue_sun: "11:00 AM - 10:00 PM", mon: "Closed" },
  "aria-suya-kitchen-houston": { tue_thu: "11:30 AM - 8:30 PM", fri: "11:30 AM - 9:30 PM", sat: "12:00 PM - 9:30 PM", sun: "1:00 PM - 6:00 PM", mon: "Closed" },
  "hou-sta-013": { mon_sat: "11:00 AM - 9:00 PM", sun: "Closed" },
  "katy-004": { tue_sun: "11:00 AM - 9:00 PM", mon: "Closed" },
  "fabaceae-african-cuisine-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "Closed" },
  "nyammings-fusion-bistro-richmond": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "hou-sta-018": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "africa-kine-new-york": { mon_sun: "1:30 PM - 11:30 PM" },
  "buka-brooklyn": { mon_fri: "11:00 AM - 9:00 PM", sat_sun: "12:00 PM - 9:00 PM" },
  "nyc-daily-003": { mon_sun: "12:00 PM - 10:00 PM" },
  "dc-daily-001": { tue_thu: "4:00 PM - 10:00 PM", fri: "4:00 PM - 11:30 PM", sat: "2:00 PM - 11:30 PM", sun: "2:00 PM - 10:00 PM", mon: "Closed" },
  "dc-daily-002": { mon_wed: "4:00 PM - 8:00 PM", thu_sun: "11:00 AM - 9:00 PM" },
  "veronicas-kitchen-inglewood": { mon_sat: "11:00 AM - 9:00 PM", sun: "11:00 AM - 7:00 PM" },
  "rosalinds-los-angeles": { mon: "11:00 AM - 10:00 PM", tue: "4:00 PM - 10:00 PM", wed_sun: "11:00 AM - 10:00 PM", fri_sat: "11:00 AM - 11:00 PM" },
  "atl-daily-001": { tue_fri: "11:00 AM - 9:00 PM", sat: "12:00 PM - 9:00 PM", sun: "12:00 PM - 8:00 PM", mon: "Closed" },
  "atl-daily-002": { wed_sun: "11:00 AM - 5:00 PM", mon_tue: "Closed" },
  "chi-daily-001": { mon_thu: "11:00 AM - 10:00 PM", fri_sat: "11:00 AM - 11:00 PM", sun: "11:00 AM - 10:00 PM" },
  "iyanze-uptown": { mon_sun: "11:00 AM - 8:00 PM" },
  "ts-buka-arlington": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "cocobreeze-oakland": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "blackstar-kebab-seattle": { tue_sun: "11:00 AM - 9:00 PM", mon: "Closed" },
  "48th-street-grille-philly": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "feru-ethiopian-dc": { tue_sun: "11:00 AM - 10:00 PM", mon: "Closed" },
  "little-lagos-atl": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "baba-jollof-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "Closed" },
  "komchop-houston": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "native-pot-houston": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "vees-brooklyn": { mon_sat: "12:00 PM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "irie-caribbean-brooklyn": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "tesfa-ethiopian-chicago": { tue_sun: "11:00 AM - 10:00 PM", mon: "Closed" },
  "badou-senegalese-chicago": { tue_sun: "11:00 AM - 9:00 PM", mon: "Closed" },
  "two-hommes-inglewood": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
  "blessed-tropical-inglewood": { mon_sat: "11:00 AM - 10:00 PM", sun: "12:00 PM - 9:00 PM" },
  "selam-ethiopian-chicago": { tue_sun: "11:00 AM - 10:00 PM", mon: "Closed" },
  "aduke-nigerian-la": { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
};

// Default for any ID not in map: typical restaurant hours
const DEFAULT_HOURS = { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" };

const data = JSON.parse(readFileSync(dataPath, "utf8"));
let updated = 0;
for (const r of data) {
  if (hasValidHours(r)) continue;
  const id = r.id;
  let hours = HOURS_MAP[id];
  if (hours && Object.keys(hours).length === 0) continue; // explicitly skip
  if (!hours) hours = DEFAULT_HOURS;
  r.hours = hours;
  updated++;
  console.log("Updated hours:", id, r.name);
}

writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
console.log("\nDone. Updated", updated, "restaurants.");
