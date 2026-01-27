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

  console.log("🔍 Checking which restaurants should be displayable...\n");

  const { data: restaurants, error } = await supabase
    .from("restaurants_with_rating")
    .select("id, name, slug, address, images, cuisine_types, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  console.log(`Found ${restaurants?.length || 0} active restaurants\n`);

  const issues = {
    missingAddress: [],
    missingImages: [],
    missingCuisine: [],
    allGood: [],
  };

  for (const restaurant of restaurants || []) {
    const addr = restaurant.address;
    const hasAddress = addr && typeof addr === "object" && (addr.street || addr.city);
    const hasImages = restaurant.images && Array.isArray(restaurant.images) && restaurant.images.length > 0;
    const hasCuisine = restaurant.cuisine_types && Array.isArray(restaurant.cuisine_types) && restaurant.cuisine_types.length > 0;

    if (!hasAddress) {
      issues.missingAddress.push(restaurant);
    } else if (!hasImages) {
      issues.missingImages.push(restaurant);
    } else if (!hasCuisine) {
      issues.missingCuisine.push(restaurant);
    } else {
      issues.allGood.push(restaurant);
    }
  }

  console.log("📊 Displayability Analysis:");
  console.log(`   ✅ Fully displayable: ${issues.allGood.length}`);
  console.log(`   ⚠️  Missing address: ${issues.missingAddress.length}`);
  console.log(`   ⚠️  Missing images: ${issues.missingImages.length}`);
  console.log(`   ⚠️  Missing cuisine types: ${issues.missingCuisine.length}`);

  if (issues.missingAddress.length > 0) {
    console.log("\n❌ Restaurants missing addresses:");
    issues.missingAddress.forEach((r) => {
      console.log(`   - ${r.name} (${r.slug})`);
    });
  }

  if (issues.missingCuisine.length > 0) {
    console.log("\n⚠️  Restaurants missing cuisine types:");
    issues.missingCuisine.forEach((r) => {
      console.log(`   - ${r.name} (${r.slug})`);
    });
  }

  console.log(`\n✅ Total restaurants that should display: ${issues.allGood.length + issues.missingImages.length}`);
  console.log(`   (Images are optional, so restaurants without images can still display)`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
