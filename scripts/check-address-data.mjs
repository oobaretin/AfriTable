#!/usr/bin/env node
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Checking address data for all restaurants...\n");

  const { data: restaurants, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, address, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  const oldRestaurants = (restaurants || []).filter((r) => {
    const date = new Date(r.created_at);
    return date < new Date("2026-01-26");
  });
  const newRestaurants = (restaurants || []).filter((r) => {
    const date = new Date(r.created_at);
    return date >= new Date("2026-01-26");
  });

  console.log(`📊 Total: ${restaurants?.length || 0}`);
  console.log(`   Old (before 1/26): ${oldRestaurants.length}`);
  console.log(`   New (1/26 or later): ${newRestaurants.length}\n`);

  // Check address data
  const oldWithCity = oldRestaurants.filter((r) => {
    const addr = r.address;
    return addr && typeof addr === "object" && addr.city;
  });
  const newWithCity = newRestaurants.filter((r) => {
    const addr = r.address;
    return addr && typeof addr === "object" && addr.city;
  });

  const oldWithoutCity = oldRestaurants.filter((r) => {
    const addr = r.address;
    return !addr || typeof addr !== "object" || !addr.city;
  });
  const newWithoutCity = newRestaurants.filter((r) => {
    const addr = r.address;
    return !addr || typeof addr !== "object" || !addr.city;
  });

  console.log(`📍 Address data:`);
  console.log(`   Old restaurants with city: ${oldWithCity.length}/${oldRestaurants.length}`);
  console.log(`   New restaurants with city: ${newWithCity.length}/${newRestaurants.length}`);
  console.log(`   Old restaurants without city: ${oldWithoutCity.length}`);
  console.log(`   New restaurants without city: ${newWithoutCity.length}\n`);

  if (newWithoutCity.length > 0) {
    console.log(`⚠️  New restaurants missing city data:`);
    newWithoutCity.slice(0, 10).forEach((r) => {
      console.log(`  - ${r.name} (${r.slug})`);
      console.log(`    Address:`, JSON.stringify(r.address));
    });
    if (newWithoutCity.length > 10) {
      console.log(`  ... and ${newWithoutCity.length - 10} more`);
    }
    console.log();
  }

  // Test city filter
  console.log(`🔍 Testing city filter "Houston"...\n`);
  const houstonOld = oldRestaurants.filter((r) => {
    const addr = r.address;
    if (!addr || typeof addr !== "object") return false;
    const city = typeof addr.city === "string" ? addr.city.toLowerCase() : "";
    return city.includes("houston");
  });
  const houstonNew = newRestaurants.filter((r) => {
    const addr = r.address;
    if (!addr || typeof addr !== "object") return false;
    const city = typeof addr.city === "string" ? addr.city.toLowerCase() : "";
    return city.includes("houston");
  });

  console.log(`   Old restaurants in Houston: ${houstonOld.length}`);
  console.log(`   New restaurants in Houston: ${houstonNew.length}`);
  console.log(`   Total in Houston: ${houstonOld.length + houstonNew.length}\n`);

  if (houstonOld.length + houstonNew.length < restaurants.length) {
    console.log(`💡 Note: Some restaurants are not in Houston, so they won't show when filtering by city.`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
