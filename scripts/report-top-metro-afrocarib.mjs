#!/usr/bin/env node
/**
 * Reports African & Caribbean restaurants in data/restaurants.json
 * assigned to top-15 US metros (2023 OMB CBSAs), grouped by vibe_category
 * (matching site filter: Fine Dining | Authentic Staples | Community Favorites + Daily Driver via vibe text).
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "data", "restaurants.json");

const CARIBBEAN_KEYS = /\b(Jamaican|Caribbean|Trinidad|Trinidadian|Haitian|Bahamian|Guyanese|Barbadian|Puerto Rican|Cuban|Dominican)/i;
const AFRICAN_KEYS =
  /\b(Nigerian|Ghanaian|Ethiopian|Eritrean|Kenyan|Senegalese|South African|Cameroonian|Somali|West African|East African|Ivorian|Moroccan|Tunisian|Egyptian|Ugandan|Rwandan|Malian|Liberian|Sierra Leone|Gambian|Cape Verde|Angolan|Afro-|African\b)/i;

const REGION_AFRICA = /\b(West African|East African|North African|Southern African|Central African)\b/i;

/** Primary cities / common suburbs → metro label (rank 1–15). Order: first match wins */
const METRO_RULES = [
  {
    rank: 1,
    label: "New York-Newark-Jersey City (NY-NJ-PA)",
    cities: new Set(
      [
        "new york",
        "brooklyn",
        "queens",
        "bronx",
        "manhattan",
        "staten island",
        "newark",
        "jersey city",
        "yonkers",
        "paterson",
        "elizabeth",
        "clifton",
        "passaic",
        "east orange",
        "bayonne",
        "north bergen",
        "hoboken",
        "west new york",
        "union city",
        "far rockaway",
        "flushing",
        "jamaica",
        "astoria",
      ].map((c) => c.toLowerCase())
    ),
  },
  {
    rank: 2,
    label: "Los Angeles-Long Beach-Anaheim (CA)",
    cities: new Set(
      ["los angeles", "long beach", "anaheim", "santa ana", "irvine", "glendale", "huntington beach", "pasadena", "torrance", "orange", "fullerton", "costa mesa", "westminster", "inglewood", "north hollywood", "compton"].map((c) =>
        c.toLowerCase()
      )
    ),
  },
  {
    rank: 3,
    label: "Chicago-Naperville-Elgin (IL-IN-WI)",
    cities: new Set(
      ["chicago", "naperville", "aurora", "joliet", "elgin", "evanston", "skokie", "oak park", "waukegan", "cicero"].map((c) => c.toLowerCase())
    ),
  },
  {
    rank: 4,
    label: "Dallas-Fort Worth-Arlington (TX)",
    cities: new Set(
      ["dallas", "fort worth", "arlington", "plano", "irving", "garland", "grand prairie", "richardson", "mckinney", "frisco", "denton", "carrollton", "mesquite", "lewisville"].map((c) => c.toLowerCase())
    ),
  },
  {
    rank: 5,
    label: "Houston-Pasadena-The Woodlands (TX)",
    cities: new Set(
      ["houston", "pasadena", "pearland", "sugar land", "the woodlands", "league city", "katy", "spring", "missouri city", "meadows place", "richmond"].map((c) => c.toLowerCase())
    ),
  },
  {
    rank: 6,
    label: "Atlanta-Sandy Springs-Alpharetta (GA)",
    cities: new Set(
      ["atlanta", "sandy springs", "alpharetta", "marietta", "decatur", "lawrenceville", "roswell", "johns creek", "peachtree corners", "east point", "college park"].map((c) =>
        c.toLowerCase()
      )
    ),
  },
  {
    rank: 7,
    label: "Washington-Arlington-Alexandria (DC-VA-MD-WV)",
    cities: new Set(
      ["washington", "arlington", "alexandria", "bethesda", "silver spring", "rockville", "fairfax", "falls church", "reston", "gaithersburg", "bowie", "college park", "takoma park", "dmv"].map((c) =>
        c.toLowerCase()
      )
    ),
  },
  {
    rank: 8,
    label: "Miami-Fort Lauderdale-West Palm Beach (FL)",
    cities: new Set(
      ["miami", "fort lauderdale", "west palm beach", "hollywood", "pembroke pines", "hialeah", "miramar", "pompano beach", "davie", "plantation", "kendall", "coral gables", "wynwood"].map((c) =>
        c.toLowerCase()
      )
    ),
  },
  {
    rank: 9,
    label: "Philadelphia-Camden-Wilmington (PA-NJ-DE-MD)",
    cities: new Set(
      ["philadelphia", "camden", "wilmington", "chester", "upper darby", "norristown", "reading pa", "king of prussia"].map((c) => c.toLowerCase())
    ),
  },
  {
    rank: 10,
    label: "Phoenix-Mesa-Chandler (AZ)",
    cities: new Set(["phoenix", "mesa", "chandler", "scottsdale", "glendale az", "gilbert", "tempe"].map((c) => c.toLowerCase())),
  },
  {
    rank: 11,
    label: "Boston-Cambridge-Newton (MA-NH)",
    cities: new Set(
      ["boston", "cambridge", "newton", "somerville", "brookline", "quincy", "everett", "chelsea", "worcester"].map((c) => c.toLowerCase())
    ),
  },
  {
    rank: 12,
    label: "Riverside-San Bernardino-Ontario (CA)",
    cities: new Set(
      ["riverside", "san bernardino", "ontario", "rancho cucamonga", "fontana", "corona", "murrieta", "moreno valley", "colton", "redlands", "rialto"].map((c) =>
        c.toLowerCase()
      )
    ),
  },
  {
    rank: 13,
    label: "San Francisco-Oakland-Fremont (CA)",
    cities: new Set(
      ["san francisco", "oakland", "fremont", "hayward", "berkeley", "san jose", "richmond ca", "daly city"].map((c) => c.toLowerCase())
    ),
  },
  {
    rank: 14,
    label: "Detroit-Warren-Dearborn (MI)",
    cities: new Set(["detroit", "warren", "dearborn", "livonia", "troy", "westland", "farmington hills", "southfield"].map((c) => c.toLowerCase())),
  },
  {
    rank: 15,
    label: "Seattle-Tacoma-Bellevue (WA)",
    cities: new Set(["seattle", "tacoma", "bellevue", "everett wa", "kent wa", "renton", "federal way", "redmond"].map((c) => c.toLowerCase())),
  },
];

function extractCityTokens(address) {
  if (!address || typeof address !== "string") return [];
  const parts = address.split(",").map((s) => s.trim());
  /** city is usually segment before ", ST ZIP" — try second-to-last non-empty */
  const out = [];
  for (let i = Math.max(0, parts.length - 3); i < parts.length - 1; i++) {
    const seg = parts[i];
    if (!seg) continue;
    const withoutZip = seg.replace(/\s+[A-Z]{2}\s+\d{5}(-\d{4})?$/, "").trim();
    out.push(withoutZip.toLowerCase());
  }
  return out;
}

function extractState(address, recordState) {
  if (recordState && typeof recordState === "string" && /^[A-Z]{2}$/.test(recordState)) return recordState;
  const m = address && address.match(/,\s*([A-Z]{2})\s+\d{5}/);
  return m ? m[1] : null;
}

function resolveMetro(address, recordState) {
  const st = extractState(address, recordState);
  if (st === "DC") {
    const w = METRO_RULES.find((r) => r.rank === 7);
    if (w) return w;
  }
  const tokens = extractCityTokens(address);
  for (const rule of METRO_RULES) {
    for (const t of tokens) {
      const norm = t.replace(/\s+/g, " ").trim();
      if (rule.cities.has(norm)) return rule;
      /** substring match for "spring tx" vs "spring" — allow prefix */
      for (const c of rule.cities) {
        if (norm.includes(c) || c.includes(norm)) {
          if (norm.length >= 4 || c.length >= 4) return rule;
        }
      }
    }
  }
  return null;
}

function isAfroCaribbean(r) {
  const cuisine = `${r.cuisine || ""}`;
  const region = `${r.region || ""}`;
  const about = `${r.about || ""} ${r.name || ""}`;
  if (CARIBBEAN_KEYS.test(cuisine) || CARIBBEAN_KEYS.test(region) || CARIBBEAN_KEYS.test(about)) return true;
  if (AFRICAN_KEYS.test(cuisine) || AFRICAN_KEYS.test(region)) return true;
  if (REGION_AFRICA.test(region)) return true;
  return false;
}

function effectiveVibe(r) {
  const v = (r.vibe || "").toLowerCase();
  if (v.includes("daily driver")) return "Daily Driver";
  const cat = r.vibe_category;
  if (cat === "Fine Dining" || cat === "Authentic Staples" || cat === "Community Favorites") return cat;
  const raw = (r.vibe || "").trim();
  if (raw === "Fine Dining" || raw === "Authentic Staples" || raw === "Community Favorites") return raw;
  return "(uncategorized)";
}

function main() {
  const raw = fs.readFileSync(ROOT, "utf8");
  const restaurants = JSON.parse(raw);

  const summary = {};
  const outsideTop15Afro = [];

  for (const r of restaurants) {
    if (!isAfroCaribbean(r)) continue;
    const metro = resolveMetro(r.address, r.state);
    const vibe = effectiveVibe(r);
    if (!metro) {
      outsideTop15Afro.push({
        id: r.id,
        name: r.name,
        cityHint: extractCityTokens(r.address).join(" | "),
        address: r.address,
        cuisine: r.cuisine,
        vibe_category: r.vibe_category ?? null,
        vibe_text: r.vibe ?? null,
        effectiveVibe: vibe,
      });
      continue;
    }
    const key = metro.label;
    if (!summary[key]) {
      summary[key] = {
        rank: metro.rank,
        metro: key,
        counts: { All: 0, "Fine Dining": 0, "Authentic Staples": 0, "Community Favorites": 0, "Daily Driver": 0, "(uncategorized)": 0 },
        rows: [],
      };
    }
    summary[key].counts.All++;
    if (summary[key].counts[vibe] !== undefined) summary[key].counts[vibe]++;
    else summary[key].counts["(uncategorized)"]++;

    summary[key].rows.push({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      vibe_category: r.vibe_category ?? null,
      vibe: r.vibe ?? null,
      effectiveVibe: vibe,
      address: r.address,
    });
  }

  const ordered = Object.values(summary).sort((a, b) => a.rank - b.rank);

  const outDir = path.join(process.cwd(), "data", "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "top15-afrocarib-by-vibe.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "data/restaurants.json",
        note: "Afro/Caribbean heuristic on cuisine/region/name/about; metro from city tokens in address. Rows outside top-15 metros listed separately.",
        metros: ordered,
        afrocaribOutsideTop15Metros: outsideTop15Afro,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Wrote ${outPath}`);
  console.log("");
  for (const m of ordered) {
    console.log(`${m.rank}. ${m.metro}`);
    console.log(`   counts:`, m.counts);
    console.log("");
  }
  console.log(`Afro/Caribbean rows not matched to top-15 metros: ${outsideTop15Afro.length}`);
}

main();
