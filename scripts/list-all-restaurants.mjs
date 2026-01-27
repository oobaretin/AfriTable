#!/usr/bin/env node
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("📋 Listing all restaurants in Supabase...\n");

  const { data: restaurants, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, is_active, address, created_at")
    .order("name");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log("❌ No restaurants found.");
    process.exit(1);
  }

  console.log(`✅ Found ${restaurants.length} restaurants in Supabase:\n`);

  restaurants.forEach((r, i) => {
    const addr = r.address && typeof r.address === "object" 
      ? `${r.address.street || ""} ${r.address.city || ""}`.trim() 
      : "No address";
    const status = r.is_active ? "✅ Active" : "❌ Inactive";
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Slug: ${r.slug}`);
    console.log(`   Status: ${status}`);
    console.log(`   Address: ${addr || "N/A"}`);
    console.log(`   Created: ${new Date(r.created_at).toLocaleDateString()}`);
    console.log();
  });

  const active = restaurants.filter((r) => r.is_active);
  console.log(`\n📊 Summary: ${active.length} active, ${restaurants.length - active.length} inactive`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
