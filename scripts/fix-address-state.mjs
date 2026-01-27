import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// City to state mapping
const CITY_STATE_MAP = {
  "falls church": "VA",
  "richmond": "VA",
  "arlington": "VA", // Could be TX or VA, check ZIP
  "alexandria": "VA",
  "fairfax": "VA",
  "vienna": "VA",
  "reston": "VA",
  "mclean": "VA",
  "syracuse": "NY",
  "houston": "TX",
  "dallas": "TX",
  "austin": "TX",
  "san antonio": "TX",
  "fort worth": "TX",
  "atlanta": "GA",
  "washington": "DC",
};

// ZIP prefix to state mapping
const ZIP_STATE_MAP = {
  "132": "NY", // Syracuse
  "220": "VA", // Northern VA
  "221": "VA",
  "222": "VA",
  "223": "VA",
  "232": "VA", // Richmond, VA
  "233": "VA",
  "234": "VA",
  "235": "VA",
  "236": "VA",
  "770": "TX", // Houston
  "750": "TX", // Dallas
  "787": "TX", // Austin
  "782": "TX", // San Antonio
  "761": "TX", // Fort Worth
  "774": "TX", // Katy/Richmond, TX area
  "775": "TX", // Pasadena, TX area
  "776": "TX", // Beaumont area
  "777": "TX", // Beaumont area
};

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Finding restaurants with incorrect state data...\n");

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, address")
    .limit(1000);

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  const fixes = [];
  const fixedIds = new Set();

  for (const restaurant of restaurants || []) {
    if (fixedIds.has(restaurant.id)) continue;

    const addr = restaurant.address;
    if (!addr || typeof addr !== "object") continue;

    const city = (addr.city || "").toLowerCase().trim();
    const state = (addr.state || "").toUpperCase().trim();
    const zip = (addr.zip || "").trim();
    let needsFix = false;
    let newState = state;
    let reason = "";

    // First check ZIP code (most reliable)
    if (zip && zip.length >= 3) {
      const zipPrefix = zip.substring(0, 3);
      const expectedStateFromZip = ZIP_STATE_MAP[zipPrefix];
      if (expectedStateFromZip && expectedStateFromZip !== state) {
        newState = expectedStateFromZip;
        needsFix = true;
        reason = `ZIP code ${zip} (prefix ${zipPrefix}) indicates ${expectedStateFromZip}`;
      }
    }

    // Then check city-state mapping (only if ZIP didn't find issue or confirms it)
    if (city && !needsFix) {
      const expectedState = CITY_STATE_MAP[city];
      if (expectedState && expectedState !== state) {
        // Special case: Arlington could be TX or VA - ZIP takes precedence
        if (city.includes("arlington")) {
          if (zip && zip.length >= 3) {
            const zipPrefix = zip.substring(0, 3);
            if (zipPrefix.startsWith("22")) {
              newState = "VA";
              needsFix = true;
              reason = `Arlington with ZIP ${zip} should be VA`;
            } else if (zipPrefix.startsWith("76")) {
              newState = "TX";
              needsFix = true;
              reason = `Arlington with ZIP ${zip} should be TX`;
            }
          }
        } else if (city.includes("richmond")) {
          // Richmond exists in both TX and VA - trust ZIP code
          // If ZIP suggests TX (77xxx), keep TX; if ZIP suggests VA (23xxx), use VA
          if (zip && zip.length >= 3) {
            const zipPrefix = zip.substring(0, 3);
            if (zipPrefix.startsWith("77")) {
              // Texas ZIP - keep as TX
              // Don't fix
            } else if (zipPrefix.startsWith("23")) {
              newState = "VA";
              needsFix = true;
              reason = `Richmond with ZIP ${zip} should be VA`;
            }
          }
        } else {
          // For other cities, trust the city-state map
          newState = expectedState;
          needsFix = true;
          reason = `City "${addr.city}" should be in ${expectedState}`;
        }
      }
    }

    if (needsFix) {
      fixedIds.add(restaurant.id);
      fixes.push({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        reason,
        current: `${addr.street || ""}, ${addr.city || ""}, ${state}, ${zip}`,
        fixed: { ...addr, state: newState },
      });
    }
  }

  if (fixes.length === 0) {
    console.log("✅ No restaurants found with incorrect state data.");
    return;
  }

  console.log(`Found ${fixes.length} restaurant(s) with incorrect state:\n`);
  fixes.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name} (${f.slug})`);
    console.log(`   Reason: ${f.reason}`);
    console.log(`   Current: ${f.current}`);
    console.log(`   Fixed: ${f.fixed.street || ""}, ${f.fixed.city || ""}, ${f.fixed.state}, ${f.fixed.zip}\n`);
  });

  console.log("Updating restaurants...\n");

  let successCount = 0;
  for (const fix of fixes) {
    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ address: fix.fixed })
      .eq("id", fix.id);

    if (updateError) {
      console.error(`❌ Error updating ${fix.name}:`, updateError);
    } else {
      console.log(`✅ Fixed: ${fix.name}`);
      successCount++;
    }
  }

  console.log(`\n✅ Fixed ${successCount} of ${fixes.length} restaurant(s)!`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
