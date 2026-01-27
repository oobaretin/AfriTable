import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// Known food trucks to remove
const foodTrucks = [
  "dibi-rapide", // Confirmed food truck
];

// Keywords that might indicate a food truck
const foodTruckKeywords = [
  "food truck",
  "foodtruck",
  "truck",
  "mobile",
  "on wheels",
  "catering truck",
];

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Finding food trucks to remove...\n");

  // Get all restaurants
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, description, address")
    .order("name");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  const toRemove = [];

  // Check known food trucks
  for (const restaurant of restaurants || []) {
    const slug = restaurant.slug?.toLowerCase() || "";
    const name = restaurant.name?.toLowerCase() || "";
    const description = (restaurant.description || "").toLowerCase();

    // Check if it's in the known food trucks list
    if (foodTrucks.some((ft) => slug.includes(ft) || name.includes(ft))) {
      toRemove.push({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        reason: "Known food truck",
      });
      continue;
    }

    // Check for food truck keywords in name or description
    const hasKeyword = foodTruckKeywords.some(
      (keyword) =>
        name.includes(keyword) || description.includes(keyword)
    );

    if (hasKeyword) {
      toRemove.push({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        reason: `Contains food truck keyword: "${foodTruckKeywords.find((k) => name.includes(k) || description.includes(k))}"`,
      });
    }
  }

  if (toRemove.length === 0) {
    console.log("✅ No food trucks found to remove.");
    return;
  }

  console.log(`Found ${toRemove.length} food truck(s) to remove:\n`);
  toRemove.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.slug})`);
    console.log(`   Reason: ${r.reason}`);
    console.log();
  });

  // Ask for confirmation (in a script, we'll just proceed)
  console.log("Removing food trucks from database...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const item of toRemove) {
    const { error: deleteError } = await supabase
      .from("restaurants")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      console.error(`❌ Error removing ${item.name}:`, deleteError);
      errorCount++;
    } else {
      console.log(`✅ Removed: ${item.name}`);
      successCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Successfully removed: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${toRemove.length}`);

  if (successCount === toRemove.length) {
    console.log("\n✅ All food trucks removed successfully!");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
