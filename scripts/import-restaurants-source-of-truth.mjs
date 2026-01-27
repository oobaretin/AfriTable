import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// Day name mappings
const DAY_MAP = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Convert price range string to number
function parsePriceRange(priceStr) {
  if (!priceStr) return 2;
  const dollarCount = (priceStr.match(/\$/g) || []).length;
  return Math.min(Math.max(dollarCount, 1), 4);
}

// Parse address string to object
function parseAddress(addressStr) {
  if (!addressStr) return null;
  
  // Try to parse format: "6991 S Texas 6, Houston, TX 77083"
  const parts = addressStr.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2];
    const zipMatch = stateZip.match(/([A-Z]{2})\s+(\d{5})/);
    
    if (zipMatch) {
      return {
        street,
        city,
        state: zipMatch[1],
        zip: zipMatch[2],
      };
    }
  }
  
  // Fallback: return as-is
  return { street: addressStr, city: "", state: "", zip: "" };
}

// Convert time string to HH:mm format
function toHHmm(timeStr) {
  if (!timeStr) return null;
  
  // Already in HH:mm format
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // Parse formats like "12:00 PM", "12pm", "12:00pm"
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/i);
  if (!match) return null;
  
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2] || "0", 10);
  const period = match[3]?.toLowerCase();
  
  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Parse hours from the new format (e.g., "mon_sat": "12:00 PM - 12:00 AM")
function parseHours(hoursObj) {
  const result = [];
  
  for (const [key, value] of Object.entries(hoursObj)) {
    if (value === "Closed" || !value) continue;
    
    // Parse time range like "12:00 PM - 12:00 AM"
    const timeMatch = value.match(/(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)/i);
    if (!timeMatch) continue;
    
    const openTime = toHHmm(timeMatch[1]);
    const closeTime = toHHmm(timeMatch[2]);
    if (!openTime || !closeTime) continue;
    
    // Parse day range (e.g., "mon_sat", "wed_sun", "tue_sat", "sun_mon")
    const days = key.toLowerCase().split("_");
    
    if (days.length === 1) {
      // Single day
      const dayName = days[0];
      if (DAY_MAP[dayName] !== undefined) {
        result.push({
          day_of_week: DAY_MAP[dayName],
          open_time: openTime,
          close_time: closeTime,
        });
      }
    } else if (days.length === 2) {
      // Day range
      const startDay = days[0];
      const endDay = days[1];
      const startIdx = DAY_MAP[startDay];
      const endIdx = DAY_MAP[endDay];
      
      if (startIdx !== undefined && endIdx !== undefined) {
        // Handle wraparound (e.g., "wed_sun" means Wed-Sat + Sun)
        if (startIdx > endIdx) {
          // Range wraps around (e.g., wed_sun = wed-sat + sun)
          for (let i = startIdx; i <= 6; i++) {
            result.push({
              day_of_week: i,
              open_time: openTime,
              close_time: closeTime,
            });
          }
          for (let i = 0; i <= endIdx; i++) {
            result.push({
              day_of_week: i,
              open_time: openTime,
              close_time: closeTime,
            });
          }
        } else {
          // Normal range
          for (let i = startIdx; i <= endIdx; i++) {
            result.push({
              day_of_week: i,
              open_time: openTime,
              close_time: closeTime,
            });
          }
        }
      }
    }
  }
  
  return result;
}

// Normalize Instagram handle
function normalizeInstagram(instagram) {
  if (!instagram) return null;
  return instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
}

// Normalize Facebook URL
function normalizeFacebook(facebook) {
  if (!facebook) return null;
  if (facebook.startsWith("http://") || facebook.startsWith("https://")) {
    return facebook;
  }
  // Try to construct URL from page name
  return `https://www.facebook.com/${facebook.replace(/\s+/g, "")}`;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const filePath = path.join(process.cwd(), "data", "restaurants.json");
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📖 Reading ${filePath}...\n`);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const restaurants = JSON.parse(fileContent);

  console.log(`Found ${restaurants.length} restaurants to import\n`);

  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const restaurant of restaurants) {
    try {
      const slug = restaurant.id || restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      console.log(`Processing: ${restaurant.name} (${slug})`);

      // Parse data
      const address = parseAddress(restaurant.address);
      const cuisineTypes = [restaurant.cuisine, restaurant.region].filter(Boolean);
      const priceRange = parsePriceRange(restaurant.price_range);
      const hours = parseHours(restaurant.hours || {});
      const instagramHandle = normalizeInstagram(restaurant.social?.instagram);
      const facebookUrl = normalizeFacebook(restaurant.social?.facebook);
      
      // Build menu object
      const menu = restaurant.menu_highlights
        ? {
            highlights: restaurant.menu_highlights,
          }
        : null;

      // Check if restaurant exists (by slug first, then by name)
      const { data: existingBySlug } = await supabase
        .from("restaurants")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();

      let existing = existingBySlug;

      if (!existing) {
        // Try to find by name (case-insensitive)
        const { data: existingByName } = await supabase
          .from("restaurants")
          .select("id, name, slug")
          .ilike("name", restaurant.name)
          .maybeSingle();
        existing = existingByName;
      }

      const restaurantData = {
        name: restaurant.name,
        slug,
        cuisine_types: cuisineTypes,
        price_range: priceRange,
        address,
        phone: restaurant.phone || null,
        website: restaurant.website || null,
        instagram_handle: instagramHandle,
        facebook_url: facebookUrl,
        description: restaurant.about || null,
        our_story: restaurant.our_story || null,
        cultural_roots: restaurant.cultural_roots || null,
        hours: hours.length > 0 ? hours : null,
        menu: menu,
        is_active: true,
      };

      if (existing) {
        // Update existing restaurant
        const { error } = await supabase
          .from("restaurants")
          .update(restaurantData)
          .eq("id", existing.id);

        if (error) {
          console.error(`  ❌ Error updating: ${error.message}`);
          errors++;
        } else {
          console.log(`  ✅ Updated: ${restaurant.name}`);
          updated++;
        }
      } else {
        // Create new restaurant (need owner_id)
        // For now, we'll need to find or create an owner
        // Let's use a default owner or skip creation
        console.log(`  ⚠️  Restaurant not found. Need owner_id to create. Skipping creation.`);
        console.log(`  💡 To create new restaurants, you need to assign an owner_id.`);
        errors++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${restaurant.name}:`, error.message);
      errors++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⚠️  Skipped (not found): ${errors}`);
  console.log(`   Total processed: ${restaurants.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
