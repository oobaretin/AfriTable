import { config } from "dotenv";
import { getJson } from "serpapi";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), ".env.local") });

async function scrapeGoogleMaps(query: string, coordinates?: string) {
  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new Error("SERPAPI_KEY environment variable is not set");
    }

    const response = await getJson({
      engine: "google_maps",
      q: query,
      ll: coordinates || "@29.7604,-95.3698,12z", // Houston coordinates
      type: "search",
      api_key: apiKey,
    });

    return response.local_results || [];
  } catch (error) {
    console.error(`Error scraping "${query}":`, error);
    return [];
  }
}

async function getPlaceDetails(placeId: string) {
  try {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new Error("SERPAPI_KEY environment variable is not set");
    }

    const response = await getJson({
      engine: "google_maps",
      type: "place",
      place_id: placeId,
      api_key: apiKey,
    });

    return response;
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}

async function scrapeAllAfricanCaribbeanRestaurants(location: string = "Houston, TX", coordinates?: string) {
  const queries = [
    "Nigerian restaurants",
    "Ethiopian restaurants",
    "Ghanaian restaurants",
    "Senegalese restaurants",
    "Kenyan restaurants",
    "Somali restaurants",
    "Eritrean restaurants",
    "South African restaurants",
    "Jamaican restaurants",
    "Trinidadian restaurants",
    "Haitian restaurants",
    "Caribbean restaurants",
    "West African restaurants",
    "East African restaurants",
  ];

  let allRestaurants: any[] = [];

  console.log(`🔍 Starting scrape of African & Caribbean restaurants in ${location}...\n`);

  for (const query of queries) {
    console.log(`Searching: ${query}...`);
    const results = await scrapeGoogleMaps(query, coordinates);

    console.log(`  Found: ${results.length} results`);
    allRestaurants = allRestaurants.concat(results);

    // Respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Total results: ${allRestaurants.length}`);

  // Remove duplicates by place_id or title
  const uniqueRestaurants = Array.from(
    new Map(allRestaurants.map((r) => [r.place_id || r.title, r])).values(),
  );

  console.log(`📊 Unique restaurants: ${uniqueRestaurants.length}`);

  // Get detailed info for each restaurant
  console.log("\n🔍 Fetching detailed information...\n");
  const detailedRestaurants = [];

  for (let i = 0; i < Math.min(uniqueRestaurants.length, 50); i++) {
    const restaurant = uniqueRestaurants[i];

    if (restaurant.place_id) {
      console.log(`${i + 1}/${uniqueRestaurants.length}: ${restaurant.title}`);
      const details = await getPlaceDetails(restaurant.place_id);

      if (details) {
        detailedRestaurants.push({
          basic: restaurant,
          details: details,
        });
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // Convert to AfriTable format
  const formattedRestaurants = detailedRestaurants.map((r) => convertToAfriTableFormat(r.basic, r.details));

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save results
  fs.writeFileSync(
    path.join(dataDir, "serpapi-restaurants-raw.json"),
    JSON.stringify(detailedRestaurants, null, 2),
  );

  fs.writeFileSync(
    path.join(dataDir, "serpapi-restaurants-formatted.json"),
    JSON.stringify(formattedRestaurants, null, 2),
  );

  console.log("\n✅ Scraping complete!");
  console.log(`📁 Raw data: data/serpapi-restaurants-raw.json`);
  console.log(`📁 Formatted data: data/serpapi-restaurants-formatted.json`);
  console.log(`\n🚀 Next step: npm run import:json -- ./data/serpapi-restaurants-formatted.json`);

  return formattedRestaurants;
}

function convertToAfriTableFormat(basic: any, details: any) {
  // Parse address
  const addressParts = (basic.address || "").split(",").map((s: string) => s.trim());
  const street = addressParts[0] || "";
  const city = addressParts[1] || "Houston";
  const stateZip = addressParts[2] || "TX";
  const zip = stateZip.match(/\d{5}/)?.[0] || "77000";

  // Determine cuisine types
  const cuisineTypes = determineCuisineTypes(basic.title, basic.type);

  // Parse hours
  const hours = parseHours(details?.hours);

  // Get photos
  const photos = details?.photos?.slice(0, 10).map((p: any) => p.thumbnail) || [];

  return {
    name: basic.title,
    cuisine_types: cuisineTypes,
    address: {
      street,
      city,
      state: "TX",
      zip,
      coordinates: {
        lat: basic.latitude || basic.gps_coordinates?.latitude,
        lng: basic.longitude || basic.gps_coordinates?.longitude,
      },
    },
    phone: basic.phone || details?.phone,
    website: basic.website || details?.website,
    description: generateDescription(basic.title, cuisineTypes, details),
    price_range: parsePriceRange(basic.price || details?.price),
    hours,
    google_rating: basic.rating,
    google_review_count: basic.reviews,
    photos,
    google_place_id: basic.place_id,
    google_maps_url: basic.link,
  };
}

function determineCuisineTypes(title: string, type: string): string[] {
  const text = `${title} ${type}`.toLowerCase();
  const cuisines: string[] = [];

  const mapping: Record<string, string[]> = {
    nigerian: ["Nigerian", "West African"],
    ethiopian: ["Ethiopian", "East African"],
    ghanaian: ["Ghanaian", "West African"],
    senegalese: ["Senegalese", "West African"],
    kenyan: ["Kenyan", "East African"],
    somali: ["Somali", "East African"],
    eritrean: ["Eritrean", "East African"],
    "south african": ["South African", "African"],
    jamaican: ["Jamaican", "Caribbean"],
    trinidadian: ["Trinidadian", "Caribbean"],
    haitian: ["Haitian", "Caribbean"],
    caribbean: ["Caribbean"],
    "west african": ["West African"],
    "east african": ["East African"],
  };

  for (const [key, values] of Object.entries(mapping)) {
    if (text.includes(key)) {
      cuisines.push(...values);
      break;
    }
  }

  if (cuisines.length === 0) {
    cuisines.push("African");
  }

  return [...new Set(cuisines)];
}

function parseHours(hoursData: any) {
  const defaultHours = {
    monday: { open: "11:00", close: "22:00", closed: false },
    tuesday: { open: "11:00", close: "22:00", closed: false },
    wednesday: { open: "11:00", close: "22:00", closed: false },
    thursday: { open: "11:00", close: "22:00", closed: false },
    friday: { open: "11:00", close: "23:00", closed: false },
    saturday: { open: "11:00", close: "23:00", closed: false },
    sunday: { open: "12:00", close: "21:00", closed: false },
  };

  if (!hoursData) return defaultHours;

  // Parse SerpAPI hours format
  // This will vary - adjust based on actual response

  return defaultHours;
}

function parsePriceRange(price?: string): number {
  if (!price) return 2;
  const dollarCount = (price.match(/\$/g) || []).length;
  return Math.min(Math.max(dollarCount, 1), 4);
}

function generateDescription(name: string, cuisines: string[], details: any): string {
  const cuisineStr = cuisines[0] || "African";
  const baseDesc = `Authentic ${cuisineStr} restaurant in Houston.`;

  if (details?.description) {
    return details.description;
  }

  return `${baseDesc} Experience traditional ${cuisineStr} flavors and hospitality at ${name}.`;
}

// Run the scraper if called directly
if (require.main === module) {
  scrapeAllAfricanCaribbeanRestaurants()
    .then(() => {
      console.log("\n✅ Scraping completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Scraping failed:", error);
      process.exit(1);
    });
}

export { scrapeAllAfricanCaribbeanRestaurants, scrapeGoogleMaps, getPlaceDetails };
