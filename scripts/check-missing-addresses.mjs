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

  console.log("🔍 Checking restaurants with missing or invalid addresses...\n");

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, address, phone, website")
    .order("name");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  const missingAddress = [];

  for (const restaurant of restaurants || []) {
    const addr = restaurant.address;
    
    if (!addr || typeof addr !== "object") {
      missingAddress.push({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: addr,
        phone: restaurant.phone,
        website: restaurant.website,
      });
      continue;
    }

    const street = (addr.street || "").trim();
    const city = (addr.city || "").trim();
    const state = (addr.state || "").trim();
    const zip = (addr.zip || "").trim();

    if (!street || !city || !state || !zip) {
      missingAddress.push({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        address: addr,
        missing: {
          street: !street,
          city: !city,
          state: !state,
          zip: !zip,
        },
        phone: restaurant.phone,
        website: restaurant.website,
      });
    }
  }

  if (missingAddress.length === 0) {
    console.log("✅ All restaurants have valid addresses!\n");
    return;
  }

  console.log(`⚠️  Found ${missingAddress.length} restaurant(s) with missing or invalid addresses:\n`);

  for (const restaurant of missingAddress) {
    console.log(`📋 ${restaurant.name} (${restaurant.slug})`);
    console.log(`   ID: ${restaurant.id}`);
    if (restaurant.missing) {
      const missing = Object.entries(restaurant.missing)
        .filter(([_, isMissing]) => isMissing)
        .map(([field]) => field);
      console.log(`   Missing fields: ${missing.join(", ")}`);
    } else {
      console.log(`   Address format: ${typeof restaurant.address} (expected object)`);
    }
    console.log(`   Current address data:`, JSON.stringify(restaurant.address, null, 2));
    console.log(`   Phone: ${restaurant.phone || "missing"}`);
    console.log(`   Website: ${restaurant.website || "missing"}`);
    console.log();
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total restaurants: ${restaurants?.length || 0}`);
  console.log(`   Missing/invalid addresses: ${missingAddress.length}`);
  console.log(`\n💡 These restaurants need manual address entry in the admin panel.`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
