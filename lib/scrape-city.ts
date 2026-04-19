import { config } from "dotenv";
import { scrapeAllAfricanCaribbeanRestaurants } from "./scrape-with-serpapi";
import { NATIONWIDE_SCRAPE_CITIES, type ScrapeCity } from "./nationwide-scrape-cities";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), ".env.local") });

const LEGACY_EIGHT_NAMES = new Set([
  "Houston",
  "Atlanta",
  "Washington",
  "New York",
  "Los Angeles",
  "Chicago",
  "Dallas",
  "Miami",
]);

const LEGACY_EIGHT: ScrapeCity[] = NATIONWIDE_SCRAPE_CITIES.filter((c) => LEGACY_EIGHT_NAMES.has(c.name));

/**
 * Default = 8 core markets (keeps SerpAPI spend predictable).
 * `nationwide` or `all` = every city in NATIONWIDE_SCRAPE_CITIES.
 * Or pass one or more city names, e.g. `Phoenix`, `Tampa` (match `name` field).
 */
function resolveCitiesToScrape(argv: string[]): ScrapeCity[] {
  if (argv.length === 0) {
    return LEGACY_EIGHT;
  }
  if (argv[0] === "nationwide" || argv[0] === "all") {
    return NATIONWIDE_SCRAPE_CITIES;
  }
  const want = new Set(argv);
  const picked = NATIONWIDE_SCRAPE_CITIES.filter((c) => want.has(c.name));
  if (picked.length === 0) {
    console.warn("No matching city names. Using legacy 8. Valid names include: Phoenix, Boston, …");
    return LEGACY_EIGHT;
  }
  return picked;
}

async function scrapeMultipleCities(cityNames?: string[]) {
  const args = cityNames ?? [];
  const citiesToScrape = resolveCitiesToScrape(args);

  if (args.length === 0) {
    console.log("ℹ️  No args: scraping legacy 8 metros. For full nationwide list: tsx lib/scrape-city.ts nationwide\n");
  }

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

      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const citySlug = city.name.toLowerCase().replace(/\s+/g, "-");
      fs.writeFileSync(path.join(dataDir, `serpapi-${citySlug}-restaurants.json`), JSON.stringify(results, null, 2));

      console.log(`\n✅ ${city.name}: ${results.length} restaurants saved`);
      console.log(`📁 File: data/serpapi-${citySlug}-restaurants.json`);

      if (citiesToScrape.indexOf(city) < citiesToScrape.length - 1) {
        console.log("\n⏳ Waiting 5 seconds before next city...\n");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`\n❌ Error scraping ${city.name}:`, error);
      allResults[city.name] = [];
    }
  }

  const allRestaurants = Object.values(allResults).flat();

  const uniqueRestaurants = Array.from(new Map(allRestaurants.map((r) => [`${r.name}-${r.address?.street || ""}`, r])).values());

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, "serpapi-all-cities-restaurants.json"), JSON.stringify(uniqueRestaurants, null, 2));

  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 SUMMARY");
  console.log(`${"=".repeat(50)}`);
  console.log(`Total cities scraped: ${citiesToScrape.length}`);
  console.log(`Total restaurants found: ${allRestaurants.length}`);
  console.log(`Unique restaurants: ${uniqueRestaurants.length}`);
  console.log(`\n📁 Combined file: data/serpapi-all-cities-restaurants.json`);

  console.log(`\n📋 By City:`);
  for (const city of citiesToScrape) {
    const count = allResults[city.name]?.length || 0;
    console.log(`  ${city.name}: ${count} restaurants`);
  }

  console.log(`\n🚀 Next step: npm run import:json -- ./data/serpapi-all-cities-restaurants.json`);

  return uniqueRestaurants;
}

if (require.main === module) {
  const cityArgs = process.argv.slice(2);

  scrapeMultipleCities(cityArgs)
    .then(() => {
      console.log("\n✅ Multi-city scraping completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Multi-city scraping failed:", error);
      process.exit(1);
    });
}

/** @deprecated Use NATIONWIDE_SCRAPE_CITIES — kept for older imports */
const CITIES = LEGACY_EIGHT;

export { scrapeMultipleCities, CITIES, NATIONWIDE_SCRAPE_CITIES, LEGACY_EIGHT };
