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
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  console.log("🔍 FULL DIAGNOSTIC - Checking everything...\n");
  console.log("=" .repeat(60));

  // Test 1: Admin access (should always work)
  console.log("\n1️⃣ Testing ADMIN access (service role key)...");
  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: adminData, error: adminError } = await supabaseAdmin
    .from("restaurants_with_rating")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .limit(5);

  if (adminError) {
    console.error("❌ ADMIN query failed:", adminError.message);
  } else {
    console.log(`✅ ADMIN: Found ${adminData?.length || 0} restaurants`);
    if (adminData && adminData.length > 0) {
      console.log("   Sample:", adminData.map((r) => r.name).join(", "));
    }
  }

  // Test 2: Public access (what the site uses)
  console.log("\n2️⃣ Testing PUBLIC access (anon key - what your site uses)...");
  const supabasePublic = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const { data: publicData, error: publicError } = await supabasePublic
    .from("restaurants_with_rating")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .limit(5);

  if (publicError) {
    console.error("❌ PUBLIC query failed:", publicError.message);
    console.error("   Code:", publicError.code);
    console.error("   Details:", publicError.details);
    console.error("   Hint:", publicError.hint);
    
    if (publicError.message.includes("Invalid API key")) {
      console.log("\n⚠️  ISSUE: Invalid anon key!");
      console.log("   Your NEXT_PUBLIC_SUPABASE_ANON_KEY is wrong.");
      console.log("   Get the correct key from: Supabase Dashboard → Settings → API → anon public");
    } else if (publicError.message.includes("permission denied") || publicError.code === "42501") {
      console.log("\n⚠️  ISSUE: RLS (Row Level Security) is blocking access!");
      console.log("   The restaurants_with_rating view needs RLS policies.");
      console.log("   Check: Supabase Dashboard → Authentication → Policies");
    }
  } else {
    console.log(`✅ PUBLIC: Found ${publicData?.length || 0} restaurants`);
    if (publicData && publicData.length > 0) {
      console.log("   Sample:", publicData.map((r) => r.name).join(", "));
    } else {
      console.log("   ⚠️  Query succeeded but returned 0 results!");
      console.log("   This might be an RLS issue or all restaurants are inactive.");
    }
  }

  // Test 3: Direct restaurants table
  console.log("\n3️⃣ Testing direct restaurants table (public access)...");
  const { data: directData, error: directError } = await supabasePublic
    .from("restaurants")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .limit(5);

  if (directError) {
    console.error("❌ Direct table query failed:", directError.message);
  } else {
    console.log(`✅ Direct table: Found ${directData?.length || 0} restaurants`);
  }

  // Test 4: Count all active
  console.log("\n4️⃣ Counting all active restaurants...");
  const { count, error: countError } = await supabaseAdmin
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (countError) {
    console.error("❌ Count failed:", countError.message);
  } else {
    console.log(`✅ Total active restaurants in database: ${count || 0}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY:\n");

  const adminWorks = !adminError && (adminData?.length || 0) > 0;
  const publicWorks = !publicError && (publicData?.length || 0) > 0;

  if (adminWorks && publicWorks) {
    console.log("✅ Everything works! Restaurants should be visible on your site.");
    console.log(`   Found ${publicData?.length || 0} restaurants via public access.`);
    console.log("\n💡 If you still don't see them on the site:");
    console.log("   1. Visit /restaurants (not just homepage)");
    console.log("   2. Check browser console for errors");
    console.log("   3. Clear browser cache");
    console.log("   4. Check Vercel environment variables match these values");
  } else if (adminWorks && !publicWorks) {
    console.log("❌ PROBLEM: Admin can see restaurants, but public cannot!");
    console.log("\n🔧 FIXES:");
    if (publicError?.message.includes("Invalid API key")) {
      console.log("   1. Fix NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel");
      console.log("   2. Get correct key from Supabase Dashboard → Settings → API");
      console.log("   3. Redeploy after updating");
    } else {
      console.log("   1. Check RLS policies in Supabase");
      console.log("   2. Ensure restaurants_with_rating view is accessible");
      console.log("   3. Check: Supabase Dashboard → Authentication → Policies");
    }
  } else if (!adminWorks) {
    console.log("❌ CRITICAL: Even admin access fails!");
    console.log("   Check your SUPABASE_SERVICE_ROLE_KEY");
  }

  console.log("\n🔗 Next steps:");
  console.log("   1. Visit: https://your-site.vercel.app/api/diagnose");
  console.log("   2. Visit: https://your-site.vercel.app/api/restaurants/search");
  console.log("   3. Check Vercel logs for errors");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
