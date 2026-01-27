import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Checking restaurant counts...\n");

  // Check total active restaurants
  const { count: totalCount, error: totalError } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (totalError) {
    console.error("❌ Error counting restaurants:", totalError);
    process.exit(1);
  }

  // Check restaurants_with_rating view
  const { count: viewCount, error: viewError } = await supabase
    .from("restaurants_with_rating")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (viewError) {
    console.error("❌ Error counting from view:", viewError);
  }

  // Get sample of restaurants
  const { data: sample, error: sampleError } = await supabase
    .from("restaurants_with_rating")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .order("name")
    .limit(10);

  console.log("📊 Restaurant Counts:");
  console.log(`   Total active restaurants (restaurants table): ${totalCount}`);
  console.log(`   Total active restaurants (restaurants_with_rating view): ${viewCount || "N/A"}`);

  if (sampleError) {
    console.error("❌ Error fetching sample:", sampleError);
  } else {
    console.log(`\n📋 Sample restaurants (first 10):`);
    sample?.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.slug})`);
    });
  }

  // Check for any inactive restaurants that might be showing
  const { count: inactiveCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  console.log(`\n📊 Inactive restaurants: ${inactiveCount || 0}`);
  console.log(`\n✅ Expected count: 61 (after removing Cafe Abuja)`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
