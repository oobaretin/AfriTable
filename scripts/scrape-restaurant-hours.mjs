import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// Day name mappings
const DAY_MAP = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

// Convert time to HH:mm format
function toHHmm(timeStr) {
  if (!timeStr) return null;
  
  // Already in HH:mm format
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // Try to parse various formats: "10:00 AM", "10am", "10:00am", etc.
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/i);
  if (!match) return null;
  
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2] || "0", 10);
  const period = match[3]?.toLowerCase();
  
  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Parse hours from HTML text
function parseHoursFromText(text) {
  const hours = [];
  const lowerText = text.toLowerCase();
  
  // First, try to find JSON-LD structured data (most reliable)
  try {
    const jsonLdMatches = text.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>|<\/script>/gi, "");
          const json = JSON.parse(jsonStr);
          
          // Handle array of items
          const items = Array.isArray(json) ? json : [json];
          for (const item of items) {
            if (item["@type"] === "Restaurant" || item["@type"] === "FoodEstablishment" || item["@type"] === "LocalBusiness") {
              if (item.openingHoursSpecification) {
                const specs = Array.isArray(item.openingHoursSpecification) 
                  ? item.openingHoursSpecification 
                  : [item.openingHoursSpecification];
                
                for (const spec of specs) {
                  const dayOfWeek = spec.dayOfWeek;
                  const opens = spec.opens;
                  const closes = spec.closes;
                  
                  if (dayOfWeek && opens && closes) {
                    // Handle array of days or single day
                    const days = Array.isArray(dayOfWeek) ? dayOfWeek : [dayOfWeek];
                    for (const day of days) {
                      const dayName = day.replace("https://schema.org/", "").replace("http://schema.org/", "").toLowerCase();
                      if (DAY_MAP[dayName] !== undefined) {
                        const open = toHHmm(opens);
                        const close = toHHmm(closes);
                        if (open && close) {
                          hours.push({ day_of_week: DAY_MAP[dayName], open_time: open, close_time: close });
                        }
                      }
                    }
                  }
                }
              }
              
              // Also check openingHours (simpler format)
              if (item.openingHours) {
                const openingHours = Array.isArray(item.openingHours) ? item.openingHours : [item.openingHours];
                for (const hoursStr of openingHours) {
                  // Format: "Mo-Fr 10:00-22:00" or "Monday 10:00-22:00"
                  const match = hoursStr.match(/([a-z]+(?:-[a-z]+)?)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i);
                  if (match) {
                    const dayRange = match[1].toLowerCase();
                    const open = toHHmm(match[2]);
                    const close = toHHmm(match[3]);
                    
                    if (open && close) {
                      // Handle day ranges like "Mo-Fr" or single days
                      if (dayRange.includes("-")) {
                        const [startDay, endDay] = dayRange.split("-");
                        const startIdx = DAY_MAP[startDay];
                        const endIdx = DAY_MAP[endDay];
                        if (startIdx !== undefined && endIdx !== undefined) {
                          for (let i = startIdx; i <= endIdx; i++) {
                            hours.push({ day_of_week: i, open_time: open, close_time: close });
                          }
                        }
                      } else if (DAY_MAP[dayRange] !== undefined) {
                        hours.push({ day_of_week: DAY_MAP[dayRange], open_time: open, close_time: close });
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  // If we found hours in structured data, return them
  if (hours.length > 0) {
    return hours;
  }
  
  // Fallback: Try to find hours in HTML text
  const patterns = [
    // "Monday: 10:00 AM - 10:00 PM" or "Monday 10am-10pm"
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[:\s]+(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)/gi,
    // "Mon-Fri: 10am-10pm"
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[-\s]+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[:\s]+(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)/gi,
  ];
  
  // Try to find hours in common formats
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const dayName = match[1]?.toLowerCase();
      const openTime = match[2] || match[3];
      const closeTime = match[3] || match[4];
      
      if (dayName && DAY_MAP[dayName] !== undefined && openTime && closeTime) {
        const dayOfWeek = DAY_MAP[dayName];
        const open = toHHmm(openTime);
        const close = toHHmm(closeTime);
        
        if (open && close) {
          // Avoid duplicates
          if (!hours.find(h => h.day_of_week === dayOfWeek)) {
            hours.push({ day_of_week: dayOfWeek, open_time: open, close_time: close });
          }
        }
      }
    }
  }
  
  return hours;
}

// Fetch and parse hours from a website
async function scrapeHoursFromWebsite(url) {
  try {
    console.log(`  Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.log(`  ❌ HTTP ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const hours = parseHoursFromText(html);
    
    if (hours.length > 0) {
      console.log(`  ✅ Found ${hours.length} day(s) of hours`);
      return hours;
    } else {
      console.log(`  ⚠️  No hours found in HTML`);
      return null;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Scraping restaurant hours from websites...\n");

  // Get all restaurants with websites
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, website, hours")
    .eq("is_active", true)
    .not("website", "is", null)
    .order("name");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log("❌ No restaurants with websites found.");
    return;
  }

  console.log(`Found ${restaurants.length} restaurants with websites\n`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    const website = restaurant.website?.trim();
    
    if (!website) {
      skipped++;
      continue;
    }

    // Ensure URL has protocol
    let url = website;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    console.log(`\n[${i + 1}/${restaurants.length}] ${restaurant.name}`);
    console.log(`  Website: ${url}`);

    const hours = await scrapeHoursFromWebsite(url);
    
    if (hours && hours.length > 0) {
      // Update restaurant hours
      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ hours: hours })
        .eq("id", restaurant.id);

      if (updateError) {
        console.log(`  ❌ Error updating: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Updated with ${hours.length} day(s) of hours`);
        updated++;
      }
    } else {
      failed++;
    }

    // Rate limiting - wait 2 seconds between requests
    if (i < restaurants.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Successfully updated: ${updated}`);
  console.log(`   ❌ Failed/Skipped: ${failed + skipped}`);
  console.log(`   Total processed: ${restaurants.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
