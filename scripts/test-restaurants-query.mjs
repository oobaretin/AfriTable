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
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  console.log("Testing restaurant queries...\n");
  console.log(`Supabase URL: ${url.substring(0, 30)}...\n`);

  // Test 1: Direct restaurants query
  console.log("1. Testing direct restaurants query...");
  const { data: directData, error: directError } = await supabase
    .from("restaurants")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .limit(5);

  if (directError) {
    console.error("❌ Error:", directError);
  } else {
    console.log(`✅ Found ${directData?.length || 0} active restaurants`);
    if (directData && directData.length > 0) {
      directData.forEach((r) => {
        console.log(`   - ${r.name} (${r.slug})`);
      });
    }
  }

  console.log("\n");

  // Test 2: View query (what homepage uses)
  console.log("2. Testing restaurants_with_rating view query...");
  const { data: viewData, error: viewError } = await supabase
    .from("restaurants_with_rating")
    .select("id,name,slug,cuisine_types,price_range,address,images,created_at,avg_rating,review_count")
    .eq("is_active", true)
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(12);

  if (viewError) {
    console.error("❌ Error:", viewError);
    console.error("   Message:", viewError.message);
    console.error("   Details:", viewError.details);
    console.error("   Hint:", viewError.hint);
  } else {
    console.log(`✅ Found ${viewData?.length || 0} restaurants in view`);
    if (viewData && viewData.length > 0) {
      viewData.slice(0, 5).forEach((r) => {
        console.log(`   - ${r.name} (rating: ${r.avg_rating || "N/A"})`);
      });
    } else {
      console.log("   ⚠️  No restaurants returned (but query succeeded)");
    }
  }

  console.log("\n");

  // Test 3: Count total active restaurants
  console.log("3. Counting total active restaurants...");
  const { count, error: countError } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (countError) {
    console.error("❌ Error:", countError);
  } else {
    console.log(`✅ Total active restaurants: ${count || 0}`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
