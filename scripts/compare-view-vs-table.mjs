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

  console.log("🔍 Comparing restaurants table vs restaurants_with_rating view...\n");

  // Get from direct table
  const { data: tableData, error: tableError } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (tableError) {
    console.error("❌ Table query error:", tableError);
    process.exit(1);
  }

  // Get from view
  const { data: viewData, error: viewError } = await supabaseAdmin
    .from("restaurants_with_rating")
    .select("id, name, slug, is_active, created_at, avg_rating, review_count")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(300);

  if (viewError) {
    console.error("❌ View query error:", viewError);
    process.exit(1);
  }

  const tableIds = new Set(tableData?.map((r) => r.id) || []);
  const viewIds = new Set(viewData?.map((r) => r.id) || []);

  const missingInView = (tableData || []).filter((r) => !viewIds.has(r.id));
  const extraInView = (viewData || []).filter((r) => !tableIds.has(r.id));

  console.log(`📊 Direct table: ${tableData?.length || 0} active restaurants`);
  console.log(`📊 View: ${viewData?.length || 0} active restaurants\n`);

  if (missingInView.length > 0) {
    console.log(`⚠️  ${missingInView.length} restaurants in table but NOT in view:\n`);
    missingInView.forEach((r) => {
      const date = new Date(r.created_at).toLocaleDateString();
      console.log(`  - ${r.name} (${r.slug}) - Created: ${date}`);
    });
    console.log();
  }

  if (extraInView.length > 0) {
    console.log(`⚠️  ${extraInView.length} restaurants in view but NOT in table:\n`);
    extraInView.forEach((r) => {
      console.log(`  - ${r.name} (${r.slug})`);
    });
    console.log();
  }

  if (missingInView.length === 0 && extraInView.length === 0) {
    console.log("✅ All restaurants from table are in the view!");
  } else {
    console.log("\n💡 The view might be filtering out restaurants due to:");
    console.log("   - Missing data in related tables");
    console.log("   - View definition issues");
    console.log("   - RLS policies");
  }

  // Check creation dates
  const oldRestaurants = (tableData || []).filter((r) => {
    const date = new Date(r.created_at);
    return date < new Date("2026-01-26");
  });
  const newRestaurants = (tableData || []).filter((r) => {
    const date = new Date(r.created_at);
    return date >= new Date("2026-01-26");
  });

  console.log(`\n📅 By creation date:`);
  console.log(`   Old (before 1/26): ${oldRestaurants.length}`);
  console.log(`   New (1/26 or later): ${newRestaurants.length}`);

  const oldInView = oldRestaurants.filter((r) => viewIds.has(r.id));
  const newInView = newRestaurants.filter((r) => viewIds.has(r.id));

  console.log(`\n📊 In view:`);
  console.log(`   Old restaurants: ${oldInView.length}/${oldRestaurants.length}`);
  console.log(`   New restaurants: ${newInView.length}/${newRestaurants.length}`);

  if (newInView.length < newRestaurants.length) {
    console.log(`\n⚠️  ISSUE: Some new restaurants are missing from the view!`);
    const missingNew = newRestaurants.filter((r) => !viewIds.has(r.id));
    console.log(`\nMissing new restaurants:`);
    missingNew.forEach((r) => {
      console.log(`  - ${r.name} (${r.slug})`);
    });
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
