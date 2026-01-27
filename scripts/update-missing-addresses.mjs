import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// Restaurant data to update
const restaurantUpdates = [
  {
    name: "Addis Ababa Ethiopian Restaurant",
    slug: "addis-ababa-ethiopian-restaurant",
    address: {
      street: "100 S Central Expy #65",
      city: "Richardson",
      state: "TX",
      zip: "75080",
    },
    phone: "(469) 319-9604",
    hours: {
      monday: { open: "11:00", close: "21:00", closed: false },
      tuesday: { open: null, close: null, closed: true },
      wednesday: { open: "11:00", close: "21:00", closed: false },
      thursday: { open: "11:00", close: "21:00", closed: false },
      friday: { open: "11:00", close: "21:00", closed: false },
      saturday: { open: "11:00", close: "21:00", closed: false },
      sunday: { open: "11:00", close: "21:00", closed: false },
    },
  },
  {
    name: "Bahel Ethiopian Mart and Kitchen",
    slug: "bahel-ethiopian-mart-and-kitchen",
    address: {
      street: "6509 Chimney Rock Rd",
      city: "Houston",
      state: "TX",
      zip: "77081",
    },
    phone: "(713) 234-6527",
    hours: {
      monday: { open: "10:00", close: "21:30", closed: false },
      tuesday: { open: null, close: null, closed: true },
      wednesday: { open: "10:00", close: "21:30", closed: false },
      thursday: { open: "10:00", close: "21:30", closed: false },
      friday: { open: "10:00", close: "21:30", closed: false },
      saturday: { open: "10:00", close: "21:30", closed: false },
      sunday: { open: "10:00", close: "21:30", closed: false },
    },
  },
  {
    name: "Chez Michelle Restaurant",
    slug: "chez-michelle-restaurant",
    address: {
      street: "6991 S Texas 6",
      city: "Houston",
      state: "TX",
      zip: "77083",
    },
    phone: "(281) 372-8925",
    hours: {
      monday: { open: "12:00", close: "00:00", closed: false },
      tuesday: { open: "12:00", close: "00:00", closed: false },
      wednesday: { open: "12:00", close: "00:00", closed: false },
      thursday: { open: "12:00", close: "00:00", closed: false },
      friday: { open: "12:00", close: "00:00", closed: false },
      saturday: { open: "12:00", close: "00:00", closed: false },
      sunday: { open: "12:00", close: "22:00", closed: false },
    },
  },
  {
    name: "Dibi Rapide",
    slug: "dibi-rapide",
    address: {
      street: "8637 Richmond Ave",
      city: "Houston",
      state: "TX",
      zip: "77063",
    },
    phone: null, // N/A
    hours: {
      monday: { open: null, close: null, closed: true },
      tuesday: { open: null, close: null, closed: true },
      wednesday: { open: null, close: null, closed: true },
      thursday: { open: "19:00", close: "01:00", closed: false },
      friday: { open: "19:00", close: "03:00", closed: false },
      saturday: { open: "19:00", close: "03:00", closed: false },
      sunday: { open: "19:00", close: "01:00", closed: false },
    },
  },
  {
    name: "Famous Princess African Kitchen",
    slug: "famous-princess-african-kitchen",
    address: {
      street: "17036 W Little York Rd",
      city: "Houston",
      state: "TX",
      zip: "77084",
    },
    phone: "(832) 419-5670",
    hours: {
      monday: { open: null, close: null, closed: true },
      tuesday: { open: "12:00", close: "21:00", closed: false },
      wednesday: { open: "12:00", close: "21:00", closed: false },
      thursday: { open: "12:00", close: "21:00", closed: false },
      friday: { open: "12:00", close: "21:00", closed: false },
      saturday: { open: "13:00", close: "21:00", closed: false },
      sunday: { open: null, close: null, closed: true },
    },
  },
  {
    name: "Omalicha Kitchen",
    slug: "omalicha-kitchen",
    address: {
      street: "1701 Cypress Creek Pkwy Ste D",
      city: "Houston",
      state: "TX",
      zip: "77090",
    },
    phone: "(281) 781-7209",
    hours: {
      monday: { open: "11:00", close: "22:00", closed: false },
      tuesday: { open: "11:00", close: "22:00", closed: false },
      wednesday: { open: "11:00", close: "22:00", closed: false },
      thursday: { open: "11:00", close: "22:00", closed: false },
      friday: { open: "11:00", close: "22:00", closed: false },
      saturday: { open: "11:00", close: "22:00", closed: false },
      sunday: { open: null, close: null, closed: true },
    },
  },
];

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Updating restaurants with missing addresses...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const update of restaurantUpdates) {
    console.log(`Updating: ${update.name}...`);

    // First, find the restaurant by slug
    const { data: restaurant, error: findError } = await supabase
      .from("restaurants")
      .select("id, name, slug")
      .eq("slug", update.slug)
      .maybeSingle();

    if (findError) {
      console.error(`❌ Error finding ${update.name}:`, findError);
      errorCount++;
      continue;
    }

    if (!restaurant) {
      console.error(`❌ Restaurant not found: ${update.name} (${update.slug})`);
      errorCount++;
      continue;
    }

    // Prepare update data
    const updateData = {
      address: update.address,
      hours: update.hours,
    };

    // Only update phone if provided
    if (update.phone) {
      updateData.phone = update.phone;
    }

    // Update the restaurant
    const { error: updateError } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("id", restaurant.id);

    if (updateError) {
      console.error(`❌ Error updating ${update.name}:`, updateError);
      errorCount++;
    } else {
      console.log(`✅ Updated: ${update.name}`);
      console.log(`   Address: ${update.address.street}, ${update.address.city}, ${update.address.state} ${update.address.zip}`);
      if (update.phone) {
        console.log(`   Phone: ${update.phone}`);
      }
      console.log();
      successCount++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Successfully updated: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${restaurantUpdates.length}`);

  if (successCount === restaurantUpdates.length) {
    console.log("\n✅ All restaurants updated successfully!");
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
