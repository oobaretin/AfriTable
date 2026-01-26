#!/usr/bin/env node
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Load `.env*` files (including `.env.local`) like Next.js does.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

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

  console.log("🔍 Verifying Production Database Status\n");
  console.log(`Supabase URL: ${url.substring(0, 40)}...\n`);

  // Check 1: Total restaurants
  console.log("1️⃣  Total Restaurants");
  const { count: totalCount, error: totalError } = await supabaseAdmin
    .from("restaurants")
    .select("*", { count: "exact", head: true });

  if (totalError) {
    console.error("   ❌ Error:", totalError.message);
  } else {
    console.log(`   ✅ Total restaurants: ${totalCount || 0}`);
  }

  // Check 2: Active restaurants
  console.log("\n2️⃣  Active Restaurants");
  const { count: activeCount, error: activeError } = await supabaseAdmin
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (activeError) {
    console.error("   ❌ Error:", activeError.message);
  } else {
    console.log(`   ✅ Active restaurants: ${activeCount || 0}`);
    if (activeCount === 0) {
      console.log("   ⚠️  WARNING: No active restaurants found!");
    }
  }

  // Check 3: Inactive restaurants
  console.log("\n3️⃣  Inactive Restaurants");
  const { count: inactiveCount, error: inactiveError } = await supabaseAdmin
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  if (inactiveError) {
    console.error("   ❌ Error:", inactiveError.message);
  } else {
    console.log(`   ⚠️  Inactive restaurants: ${inactiveCount || 0}`);
    if (inactiveCount > 0) {
      console.log("   💡 Run: npm run activate:restaurants");
    }
  }

  // Check 4: Sample restaurants
  console.log("\n4️⃣  Sample Restaurants (first 5)");
  const { data: samples, error: samplesError } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (samplesError) {
    console.error("   ❌ Error:", samplesError.message);
  } else if (!samples || samples.length === 0) {
    console.log("   ⚠️  No restaurants found in database");
    console.log("   💡 Run: npm run seed:houston");
  } else {
    samples.forEach((r) => {
      const status = r.is_active ? "✅" : "❌";
      console.log(`   ${status} ${r.name} (${r.slug})`);
    });
  }

  // Check 5: View query test
  console.log("\n5️⃣  Testing restaurants_with_rating View");
  const { data: viewData, error: viewError } = await supabaseAdmin
    .from("restaurants_with_rating")
    .select("id, name, avg_rating, review_count")
    .eq("is_active", true)
    .limit(5);

  if (viewError) {
    console.error("   ❌ Error:", viewError.message);
    console.error("   Details:", viewError.details);
  } else {
    console.log(`   ✅ View query successful: ${viewData?.length || 0} results`);
    if (viewData && viewData.length > 0) {
      viewData.forEach((r) => {
        console.log(`      - ${r.name} (rating: ${r.avg_rating || "N/A"})`);
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total restaurants: ${totalCount || 0}`);
  console.log(`Active restaurants: ${activeCount || 0}`);
  console.log(`Inactive restaurants: ${inactiveCount || 0}`);

  if (totalCount === 0) {
    console.log("\n⚠️  ACTION REQUIRED: No restaurants in database!");
    console.log("   Run: npm run seed:houston");
  } else if (activeCount === 0) {
    console.log("\n⚠️  ACTION REQUIRED: All restaurants are inactive!");
    console.log("   Run: npm run activate:restaurants");
  } else {
    console.log("\n✅ Database looks good!");
    console.log("   If restaurants still don't show on site:");
    console.log("   1. Check Vercel environment variables");
    console.log("   2. Check browser console for errors");
    console.log("   3. Verify RLS policies allow public reads");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
