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

  console.log("🔍 Finding restaurants with incorrect state data...\n");

  // Find restaurants with Falls Church, VA addresses that have TX as state
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, address")
    .limit(1000);

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  const fixes = [];
  
  for (const restaurant of restaurants || []) {
    const addr = restaurant.address;
    if (!addr || typeof addr !== "object") continue;
    
    const city = (addr.city || "").toLowerCase();
    const state = addr.state || "";
    const zip = addr.zip || "";
    
    // Fix Falls Church, VA
    if (city.includes("falls church") && state === "TX") {
      fixes.push({
        id: restaurant.id,
        name: restaurant.name,
        current: `${addr.street || ""}, ${addr.city || ""}, ${state}, ${zip}`,
        fixed: { ...addr, state: "VA" },
      });
    }
    
    // Fix other common VA cities that might be mislabeled
    const vaCities = ["arlington", "alexandria", "fairfax", "vienna", "reston", "mclean"];
    if (vaCities.some(c => city.includes(c)) && state === "TX" && zip.startsWith("22")) {
      fixes.push({
        id: restaurant.id,
        name: restaurant.name,
        current: `${addr.street || ""}, ${addr.city || ""}, ${state}, ${zip}`,
        fixed: { ...addr, state: "VA" },
      });
    }
  }

  if (fixes.length === 0) {
    console.log("✅ No restaurants found with incorrect state data.");
    return;
  }

  console.log(`Found ${fixes.length} restaurant(s) with incorrect state:\n`);
  fixes.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name}`);
    console.log(`   Current: ${f.current}`);
    console.log(`   Fixed: ${f.fixed.street || ""}, ${f.fixed.city || ""}, ${f.fixed.state}, ${f.fixed.zip}\n`);
  });

  console.log("Updating restaurants...\n");

  for (const fix of fixes) {
    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ address: fix.fixed })
      .eq("id", fix.id);

    if (updateError) {
      console.error(`❌ Error updating ${fix.name}:`, updateError);
    } else {
      console.log(`✅ Fixed: ${fix.name}`);
    }
  }

  console.log(`\n✅ Fixed ${fixes.length} restaurant(s)!`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
