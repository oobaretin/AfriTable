import { config } from "dotenv";
import { scrapeAllAfricanCaribbeanRestaurants } from "./scrape-with-serpapi";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), ".env.local") });

const CITIES = [
  { name: "Houston", state: "TX", ll: "@29.7604,-95.3698,12z" },
  { name: "Atlanta", state: "GA", ll: "@33.7490,-84.3880,12z" },
  { name: "Washington", state: "DC", ll: "@38.9072,-77.0369,12z" },
  { name: "New York", state: "NY", ll: "@40.7128,-74.0060,12z" },
  { name: "Los Angeles", state: "CA", ll: "@34.0522,-118.2437,12z" },
  { name: "Chicago", state: "IL", ll: "@41.8781,-87.6298,12z" },
  { name: "Dallas", state: "TX", ll: "@32.7767,-96.7970,12z" },
  { name: "Miami", state: "FL", ll: "@25.7617,-80.1918,12z" },
];

async function scrapeMultipleCities(cityNames?: string[]) {
  const citiesToScrape = cityNames
    ? CITIES.filter((c) => cityNames.includes(c.name))
    : CITIES;

  console.log(`🌍 Scraping ${citiesToScrape.length} cities...\n`);

  const allResults: Record<string, any[]> = {};

  for (const city of citiesToScrape) {
    const location = `${city.name}, ${city.state}`;
    console.log(`\n${"=".repeat(50)}`);
    console.log(`📍 Scraping: ${location}`);
    console.log(`${"=".repeat(50)}\n`);

    try {
      const results = await scrapeAllAfricanCaribbeanRestaurants(location, city.ll);
      allResults[city.name] = results;

      // Save city-specific results
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const citySlug = city.name.toLowerCase().replace(/\s+/g, "-");
      fs.writeFileSync(
        path.join(dataDir, `serpapi-${citySlug}-restaurants.json`),
        JSON.stringify(results, null, 2),
      );

      console.log(`\n✅ ${city.name}: ${results.length} restaurants saved`);
      console.log(`📁 File: data/serpapi-${citySlug}-restaurants.json`);

      // Rate limit between cities
      if (citiesToScrape.indexOf(city) < citiesToScrape.length - 1) {
        console.log("\n⏳ Waiting 5 seconds before next city...\n");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`\n❌ Error scraping ${city.name}:`, error);
      allResults[city.name] = [];
    }
  }

  // Combine all results
  const allRestaurants = Object.values(allResults).flat();

  // Remove duplicates by name and address
  const uniqueRestaurants = Array.from(
    new Map(
      allRestaurants.map((r) => [`${r.name}-${r.address?.street || ""}`, r]),
    ).values(),
  );

  // Save combined results
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, "serpapi-all-cities-restaurants.json"),
    JSON.stringify(uniqueRestaurants, null, 2),
  );

  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 SUMMARY");
  console.log(`${"=".repeat(50)}`);
  console.log(`Total cities scraped: ${citiesToScrape.length}`);
  console.log(`Total restaurants found: ${allRestaurants.length}`);
  console.log(`Unique restaurants: ${uniqueRestaurants.length}`);
  console.log(`\n📁 Combined file: data/serpapi-all-cities-restaurants.json`);

  // Summary by city
  console.log(`\n📋 By City:`);
  for (const city of citiesToScrape) {
    const count = allResults[city.name]?.length || 0;
    console.log(`  ${city.name}: ${count} restaurants`);
  }

  console.log(`\n🚀 Next step: npm run import:json -- ./data/serpapi-all-cities-restaurants.json`);

  return uniqueRestaurants;
}

// Run if called directly
if (require.main === module) {
  const cityArgs = process.argv.slice(2);
  const citiesToScrape = cityArgs.length > 0 ? cityArgs : undefined;

  scrapeMultipleCities(citiesToScrape)
    .then(() => {
      console.log("\n✅ Multi-city scraping completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Multi-city scraping failed:", error);
      process.exit(1);
    });
}

export { scrapeMultipleCities, CITIES };
