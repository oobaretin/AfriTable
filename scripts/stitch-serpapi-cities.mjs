#!/usr/bin/env node
/**
 * Rebuild data/serpapi-all-cities-restaurants.json from all per-city scrape files.
 * scrape-city.ts only combines restaurants from the cities in the current run.
 */
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const files = fs
  .readdirSync(dataDir)
  .filter((f) => /^serpapi-[a-z0-9-]+-restaurants\.json$/.test(f) && f !== "serpapi-all-cities-restaurants.json");

const all = [];
for (const f of files) {
  const arr = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
  if (Array.isArray(arr)) all.push(...arr);
}

const unique = Array.from(
  new Map(all.map((r) => [`${r.name}-${r.address?.street || r.address || ""}`, r])).values()
);

const out = path.join(dataDir, "serpapi-all-cities-restaurants.json");
fs.writeFileSync(out, JSON.stringify(unique, null, 2));
console.log(`Stitched ${files.length} city files → ${unique.length} unique restaurants → ${out}`);
