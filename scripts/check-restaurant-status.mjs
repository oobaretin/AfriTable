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
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Checking restaurant status and visibility...\n");

  // Check all restaurants
  const { data: allRestaurants, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, is_active, is_claimed, created_at")
    .order("name");

  if (error) {
    console.error("❌ Error:", error);
    if (error.code === "42703") {
      console.log("\n⚠️  Note: 'is_claimed' column doesn't exist in your database.");
      console.log("   This is why pending restaurants page shows nothing.");
      console.log("   The imported restaurants are all active, so they won't show as pending anyway.\n");
      
      // Re-query without is_claimed
      const { data: restaurants, error: retryError } = await supabaseAdmin
        .from("restaurants")
        .select("id, name, slug, is_active, created_at")
        .order("name");
      
      if (retryError) {
        console.error("❌ Retry error:", retryError);
        process.exit(1);
      }
      
      const active = restaurants?.filter((r) => r.is_active) || [];
      const inactive = restaurants?.filter((r) => !r.is_active) || [];
      
      console.log(`📊 Total: ${restaurants?.length || 0}`);
      console.log(`✅ Active: ${active.length}`);
      console.log(`❌ Inactive (would show in pending): ${inactive.length}\n`);
      
      if (inactive.length > 0) {
        console.log("Inactive restaurants (these would show in pending):");
        inactive.forEach((r) => {
          console.log(`  - ${r.name} (${r.slug})`);
        });
      } else {
        console.log("✅ All restaurants are active - they won't show in pending.");
        console.log("   This is expected since we activated them all.\n");
      }
      
      return;
    }
    process.exit(1);
  }

  const active = allRestaurants?.filter((r) => r.is_active) || [];
  const inactive = allRestaurants?.filter((r) => !r.is_active) || [];
  const claimed = allRestaurants?.filter((r) => r.is_claimed) || [];
  const unclaimed = allRestaurants?.filter((r) => !r.is_claimed) || [];
  const pending = allRestaurants?.filter((r) => !r.is_active && r.is_claimed) || [];

  console.log(`📊 Total restaurants: ${allRestaurants?.length || 0}`);
  console.log(`✅ Active: ${active.length}`);
  console.log(`❌ Inactive: ${inactive.length}`);
  console.log(`🔐 Claimed: ${claimed.length}`);
  console.log(`🔓 Unclaimed: ${unclaimed.length}`);
  console.log(`⏳ Pending (inactive + claimed): ${pending.length}\n`);

  // Check view accessibility
  console.log("🔍 Testing restaurants_with_rating view...\n");
  const { data: viewData, error: viewError } = await supabaseAdmin
    .from("restaurants_with_rating")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .limit(10);

  if (viewError) {
    console.error("❌ View query error:", viewError);
  } else {
    console.log(`✅ View accessible: Found ${viewData?.length || 0} active restaurants in view`);
    if (viewData && viewData.length > 0) {
      console.log("\nSample from view:");
      viewData.slice(0, 5).forEach((r) => {
        console.log(`  - ${r.name} (${r.slug})`);
      });
    }
  }

  // Summary
  console.log("\n📋 Summary:");
  console.log(`   - All ${allRestaurants?.length || 0} restaurants are in the database`);
  console.log(`   - ${active.length} are active (visible on site)`);
  console.log(`   - ${pending.length} are pending (would show in admin)`);
  
  if (pending.length === 0 && inactive.length === 0) {
    console.log("\n✅ All restaurants are active - this is why nothing shows in pending.");
    console.log("   To see restaurants on the site, visit: /restaurants");
    console.log("   The homepage only shows 12 featured/top-rated restaurants.");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
