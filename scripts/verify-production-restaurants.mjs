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

  console.log("🔍 Verifying production restaurant state...\n");

  // Check direct restaurants table
  const { data: allRestaurants, error: allError } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, is_active")
    .order("name");

  if (allError) {
    console.error("❌ Error fetching restaurants:", allError);
    process.exit(1);
  }

  const active = allRestaurants?.filter((r) => r.is_active) || [];
  const inactive = allRestaurants?.filter((r) => !r.is_active) || [];

  console.log(`📊 Total restaurants: ${allRestaurants?.length || 0}`);
  console.log(`✅ Active: ${active.length}`);
  console.log(`❌ Inactive: ${inactive.length}\n`);

  // Check restaurants_with_rating view
  console.log("🔍 Checking restaurants_with_rating view...\n");
  const { data: viewData, error: viewError } = await supabaseAdmin
    .from("restaurants_with_rating")
    .select("id, name, slug, is_active, avg_rating, review_count")
    .eq("is_active", true)
    .limit(20);

  if (viewError) {
    console.error("❌ Error querying restaurants_with_rating view:", viewError);
    console.error("   Message:", viewError.message);
    console.error("   Details:", viewError.details);
    console.error("   Hint:", viewError.hint);
  } else {
    console.log(`✅ Found ${viewData?.length || 0} active restaurants in view`);
    if (viewData && viewData.length > 0) {
      console.log("\nSample restaurants:");
      viewData.slice(0, 10).forEach((r) => {
        console.log(`  - ${r.name} (${r.slug}) - Rating: ${r.avg_rating || "N/A"}`);
      });
    }
  }

  // Check if there are any RLS policies blocking access
  console.log("\n🔍 Checking public access...\n");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabasePublic = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const { data: publicData, error: publicError } = await supabasePublic
    .from("restaurants_with_rating")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .limit(10);

  if (publicError) {
    console.error("❌ Error with public/anonymous access:", publicError);
    console.error("   This might indicate an RLS (Row Level Security) issue");
    console.error("   Message:", publicError.message);
    console.error("   Details:", publicError.details);
    console.error("   Hint:", publicError.hint);
  } else {
    console.log(`✅ Public access works: Found ${publicData?.length || 0} restaurants`);
    if (publicData && publicData.length > 0) {
      console.log("\nPublicly accessible restaurants:");
      publicData.forEach((r) => {
        console.log(`  - ${r.name} (${r.slug})`);
      });
    } else if (active.length > 0) {
      console.log("\n⚠️  WARNING: There are active restaurants but public query returns 0!");
      console.log("   This suggests an RLS policy issue.");
    }
  }

  // Summary
  console.log("\n📋 Summary:");
  console.log(`   Total restaurants: ${allRestaurants?.length || 0}`);
  console.log(`   Active restaurants: ${active.length}`);
  console.log(`   Visible to public: ${publicData?.length || 0}`);

  if (active.length > 0 && publicData?.length === 0) {
    console.log("\n⚠️  ISSUE DETECTED: Active restaurants exist but are not publicly accessible.");
    console.log("   This is likely an RLS (Row Level Security) policy issue.");
    console.log("   Check your Supabase RLS policies for the restaurants_with_rating view.");
  } else if (active.length === 0) {
    console.log("\n⚠️  ISSUE DETECTED: No active restaurants found.");
    console.log("   Run: npm run activate:restaurants");
  } else if (publicData?.length > 0) {
    console.log("\n✅ Everything looks good! Restaurants should be visible on the site.");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
