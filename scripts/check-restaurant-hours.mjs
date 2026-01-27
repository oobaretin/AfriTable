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

  console.log("🔍 Checking restaurant hours data...\n");

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, hours")
    .eq("is_active", true)
    .order("name")
    .limit(20);

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  console.log(`Found ${restaurants?.length || 0} restaurants\n`);

  const hoursStats = {
    hasHours: 0,
    noHours: 0,
    sameHours: new Map(),
  };

  for (const restaurant of restaurants || []) {
    const hours = restaurant.hours;
    const hoursStr = JSON.stringify(hours);
    
    if (!hours || (Array.isArray(hours) && hours.length === 0)) {
      hoursStats.noHours++;
      console.log(`❌ ${restaurant.name} (${restaurant.slug}): No hours`);
    } else {
      hoursStats.hasHours++;
      const count = hoursStats.sameHours.get(hoursStr) || 0;
      hoursStats.sameHours.set(hoursStr, count + 1);
      
      if (Array.isArray(hours) && hours.length > 0) {
        const firstHour = hours[0];
        console.log(`✅ ${restaurant.name}: ${hours.length} day(s) - Sample: ${firstHour.day_of_week} ${firstHour.open_time}-${firstHour.close_time}`);
      } else {
        console.log(`⚠️  ${restaurant.name}: Hours format: ${typeof hours}`);
      }
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Restaurants with hours: ${hoursStats.hasHours}`);
  console.log(`   Restaurants without hours: ${hoursStats.noHours}`);
  console.log(`   Unique hour configurations: ${hoursStats.sameHours.size}`);
  
  if (hoursStats.sameHours.size > 0) {
    console.log("\n🔍 Hour configurations:");
    for (const [hoursStr, count] of hoursStats.sameHours.entries()) {
      if (count > 1) {
        console.log(`   ${count} restaurants share this configuration`);
      }
    }
  }

  // Check availability_settings
  console.log("\n🔍 Checking availability_settings...\n");
  const { data: settings, error: settingsError } = await supabase
    .from("availability_settings")
    .select("restaurant_id, operating_hours")
    .limit(20);

  if (settingsError) {
    console.error("❌ Error:", settingsError);
  } else {
    console.log(`Found ${settings?.length || 0} availability_settings entries`);
    for (const setting of settings || []) {
      const hours = setting.operating_hours;
      if (hours && Array.isArray(hours) && hours.length > 0) {
        console.log(`   Restaurant ${setting.restaurant_id}: ${hours.length} day(s) configured`);
      } else {
        console.log(`   Restaurant ${setting.restaurant_id}: No hours configured`);
      }
    }
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
