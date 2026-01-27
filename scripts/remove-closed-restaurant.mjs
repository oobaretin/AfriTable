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

  console.log("🔍 Finding and removing permanently closed restaurants...\n");

  // Find Cafe Abuja
  const { data: restaurants, error: findError } = await supabase
    .from("restaurants")
    .select("id, name, slug, is_active")
    .or("name.ilike.%cafe abuja%,name.ilike.%cafe%abuja%")
    .limit(10);

  if (findError) {
    console.error("❌ Error finding restaurants:", findError);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log("❌ No restaurants found matching 'Cafe Abuja'");
    return;
  }

  console.log(`Found ${restaurants.length} restaurant(s):\n`);
  restaurants.forEach((r) => {
    console.log(`  - ${r.name} (${r.slug}) - Active: ${r.is_active}`);
  });

  // Find the exact match
  const cafeAbuja = restaurants.find(
    (r) => r.name.toLowerCase().includes("cafe abuja") || r.slug.includes("cafe-abuja")
  );

  if (!cafeAbuja) {
    console.log("\n⚠️  Could not find exact match for 'Cafe Abuja'");
    console.log("Please check the list above and manually remove if needed.");
    return;
  }

  console.log(`\n🗑️  Removing: ${cafeAbuja.name} (${cafeAbuja.slug})...`);

  const { error: deleteError } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", cafeAbuja.id);

  if (deleteError) {
    console.error(`❌ Error removing ${cafeAbuja.name}:`, deleteError);
    process.exit(1);
  }

  console.log(`✅ Successfully removed: ${cafeAbuja.name}`);

  // Check total active restaurants
  const { count, error: countError } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (countError) {
    console.error("❌ Error counting restaurants:", countError);
  } else {
    console.log(`\n📊 Total active restaurants: ${count}`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
