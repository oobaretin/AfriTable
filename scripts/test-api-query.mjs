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

  console.log("🔍 Testing API query (simulating what the site does)...\n");

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  // Simulate the exact query from the API route
  const { data, error } = await supabase
    .from("restaurants_with_rating")
    .select("id,slug,name,cuisine_types,price_range,address,images,avg_rating,review_count,is_active,created_at")
    .eq("is_active", true)
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("❌ Query failed:", error.message);
    console.error("   Code:", error.code);
    console.error("   Details:", error.details);
    process.exit(1);
  }

  const rows = (data ?? []).filter((r) => r.is_active);
  
  console.log(`✅ Query successful!`);
  console.log(`📊 Total restaurants returned: ${rows.length}`);
  console.log(`   (Limit was 300, so all should be returned)\n`);

  if (rows.length < 65) {
    console.log(`⚠️  WARNING: Expected 65 restaurants but got ${rows.length}`);
    console.log(`   This suggests some restaurants are being filtered out.\n`);
  }

  // Check by creation date
  const old = rows.filter((r) => new Date(r.created_at) < new Date("2026-01-26"));
  const new_ = rows.filter((r) => new Date(r.created_at) >= new Date("2026-01-26"));

  console.log(`📅 Breakdown:`);
  console.log(`   Old (before 1/26): ${old.length}`);
  console.log(`   New (1/26 or later): ${new_.length}\n`);

  if (new_.length < 49) {
    console.log(`⚠️  ISSUE: Missing ${49 - new_.length} new restaurants!`);
    console.log(`   They might be filtered out by the view or RLS.\n`);
  }

  // Sample
  console.log(`📋 Sample restaurants (first 10):`);
  rows.slice(0, 10).forEach((r, i) => {
    const date = new Date(r.created_at).toLocaleDateString();
    console.log(`   ${i + 1}. ${r.name} - Created: ${date}`);
  });
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
