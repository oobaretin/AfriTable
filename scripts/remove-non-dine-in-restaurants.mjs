#!/usr/bin/env node
/**
 * Remove listings that are not sit-down dine-in restaurants (catering-only,
 * home/apartment operators, retail stores, coffee/souk shops, ghost kitchens).
 *
 * Run: node scripts/remove-non-dine-in-restaurants.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

const CATALOG = path.join(process.cwd(), "data", "restaurants.json");

/** id -> reason */
const REMOVE = {
  "ayobami-african-food-no-dine-in-catering-only-euclid":
    "Catering only, no dine-in (in name)",
  "nigerian-suya-tinz-newark": "Home/apartment address, not a public restaurant",
  "somali-halal-store-mechanicsburg": "Retail halal store; bad address (PA listed as TX)",
  "ethio-coffee-and-souk-houston": "Coffee shop / souk market, not a dine-in restaurant",
  "afro-pastries-indianapolis": "Pastry shop, not a sit-down restaurant",
  "karyi-kitchens-new-orleans": "Office-suite address (ghost/virtual kitchen)",
  "katy-004": "Residential address (home-based operator)",
  "intercontinental-african-nigerian-restaurant-columbus":
    "Low-quality Maps scrape (not a verified dine-in listing)",
  "alice-fufulicious-maple-heights": "Home-style fufu/product operator, not a dine-in venue",
  "golden-hands-cameroonian-food-los-angeles":
    "Takeaway-focused food vendor, not a sit-down restaurant",
  "street-suya-dallas": "Industrial address; street suya stand, not dine-in",
  "jollofinnola-slidell": "Residential-area address; home-based operator",
  "la-daily-003": "Cameroonian food truck; mobile vendor, not sit-down dine-in",
  "fannoh-flavor-african-food-truck-miami":
    "Food truck in name; no sit-down restaurant",
  "arike-african-cuisine-catering-services-catering-only-cleveland":
    "Catering only (in name and listing)",
  "chrisettas-kitchen-catering-west-chester":
    "Catering operator (in name); not a dine-in venue",
  "ayomee-s-african-kitchen-sicklerville":
    "Residential address; home-based operator",
  "delights-ghanaian-cuisine-houston":
    "Residential address; home-based operator",
};

function requireEnv(n) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const removeIds = new Set(Object.keys(REMOVE));

  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const removed = catalog.filter((r) => removeIds.has(r.id));
  const kept = catalog.filter((r) => !removeIds.has(r.id));

  console.log(`Removing ${removed.length} non-dine-in listings:\n`);
  for (const r of removed) {
    console.log(`  - ${r.id}`);
    console.log(`    ${r.name}`);
    console.log(`    ${REMOVE[r.id]}\n`);
  }

  const remainingNoWeb = kept.filter((r) => !r.website);
  console.log(`Catalog: ${catalog.length} → ${kept.length}`);
  console.log(`Without website (dine-in focus): ${remainingNoWeb.length}`);

  if (dryRun) {
    console.log("\nDRY RUN — no files or DB updated");
    return;
  }

  fs.writeFileSync(CATALOG, JSON.stringify(kept, null, 2));

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  for (const r of removed) {
    const { error } = await supabase
      .from("restaurants")
      .update({ is_active: false })
      .eq("slug", r.id);
    if (error) console.warn(`  Supabase ${r.id}:`, error.message);
  }

  console.log("\nUpdated catalog and deactivated removed slugs in Supabase.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
