#!/usr/bin/env node
/**
 * SerpAPI growth plan: metros, per-metro search budget, missing city files.
 * Requires SERPAPI_KEY. Respects SERPAPI_FREE_TIER / SERPAPI_SKIP_PLACE_DETAILS.
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const MAP_QUERY_COUNT = 13;

function cityFileSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function estimatePerMetro() {
  const skip = /^1|true|yes$/i.test(String(process.env.SERPAPI_SKIP_PLACE_DETAILS ?? ""));
  if (skip) return MAP_QUERY_COUNT;
  const free = /^1|true|yes$/i.test(String(process.env.SERPAPI_FREE_TIER ?? ""));
  const raw = process.env.SERPAPI_MAX_PLACE_DETAILS;
  const fallback = free ? 5 : 50;
  const parsed = raw !== undefined && String(raw).trim() !== "" ? parseInt(String(raw), 10) : NaN;
  const max = Number.isFinite(parsed) ? Math.min(50, Math.max(0, parsed)) : fallback;
  return MAP_QUERY_COUNT + max;
}

async function main() {
  const hasKey = !!process.env.SERPAPI_KEY;
  const perMetro = estimatePerMetro();
  const freeTier = /^1|true|yes$/i.test(String(process.env.SERPAPI_FREE_TIER ?? ""));
  const skipDetails = /^1|true|yes$/i.test(String(process.env.SERPAPI_SKIP_PLACE_DETAILS ?? ""));

  const citiesPath = path.join(process.cwd(), "lib", "nationwide-scrape-cities.ts");
  const src = fs.readFileSync(citiesPath, "utf8");
  const cities = [];
  for (const m of src.matchAll(/\{\s*name:\s*"([^"]+)",\s*state:\s*"([^"]+)"/g)) {
    cities.push({ name: m[1], state: m[2] });
  }
  if (!cities.length) throw new Error("Could not parse NATIONWIDE_SCRAPE_CITIES");

  const dataDir = path.join(process.cwd(), "data");
  const scraped = [];
  const missing = [];

  for (const c of cities) {
    const slug = cityFileSlug(c.name);
    const file = path.join(dataDir, `serpapi-${slug}-restaurants.json`);
    if (fs.existsSync(file)) scraped.push(c.name);
    else missing.push(c.name);
  }

  const monthlyCap = freeTier ? 250 : 5000;
  const batch5 = missing.slice(0, 5);
  const batch5Cost = batch5.length * perMetro;

  console.log("SerpAPI scrape plan\n");
  console.log(`  API key present:     ${hasKey ? "yes" : "NO — set SERPAPI_KEY in .env.local"}`);
  console.log(`  SERPAPI_FREE_TIER:   ${freeTier ? "on (~5 place lookups/metro)" : "off"}`);
  console.log(`  SKIP_PLACE_DETAILS:  ${skipDetails ? "on (~13 searches/metro)" : "off"}`);
  console.log(`  Est. searches/metro: ~${perMetro}`);
  console.log(`  Typical monthly cap: ~${monthlyCap} (free tier)\n`);
  console.log(`  Metros in list:      ${cities.length}`);
  console.log(`  Local scrape files:  ${scraped.length}`);
  console.log(`  Missing scrape files:${missing.length}\n`);

  if (missing.length) {
    console.log("Next metros without local JSON (first 15):");
    missing.slice(0, 15).forEach((n) => console.log(`    - ${n}`));
    if (missing.length > 15) console.log(`    … +${missing.length - 15} more\n`);

    console.log("Suggested next batch (5 metros, quota-friendly):");
    console.log(`  npm run scrape:city -- ${batch5.map((n) => `"${n}"`).join(" ")}`);
    console.log(`  Estimated searches: ~${batch5Cost} (leave headroom under ${monthlyCap}/mo)\n`);
    console.log("Then:");
    console.log("  node scripts/stitch-serpapi-cities.mjs");
    console.log("  npm run merge:serpapi");
    console.log("  npm run prepare:import && npm run import:json -- ./data/serpapi-import-safe.json");
    console.log("  npm run consolidate:restaurants");
  } else {
    console.log("All metros have local scrape files. Run merge + consolidate to refresh DB.");
  }

  const out = path.join(process.cwd(), "data", "serpapi-scrape-plan.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        perMetro,
        monthlyCap,
        scraped,
        missing,
        suggestedBatch: batch5,
        suggestedCommand: `npm run scrape:city -- ${batch5.join(" ")}`,
      },
      null,
      2,
    ),
  );
  console.log(`\n  Plan file: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
