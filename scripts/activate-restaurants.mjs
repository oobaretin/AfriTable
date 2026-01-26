#!/usr/bin/env node
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Load `.env*` files (including `.env.local`) like Next.js does.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

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

  console.log("Checking restaurants in database...\n");

  // Get all restaurants
  const { data: restaurants, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, is_active")
    .order("name");

  if (error) {
    console.error("Error fetching restaurants:", error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log("❌ No restaurants found in database.");
    console.log("💡 Run: npm run seed:houston");
    process.exit(1);
  }

  console.log(`Found ${restaurants.length} restaurants:\n`);

  const inactive = restaurants.filter((r) => !r.is_active);
  const active = restaurants.filter((r) => r.is_active);

  console.log(`✅ Active: ${active.length}`);
  console.log(`❌ Inactive: ${inactive.length}\n`);

  if (inactive.length > 0) {
    console.log("Inactive restaurants:");
    inactive.forEach((r) => {
      console.log(`  - ${r.name} (${r.slug})`);
    });
    console.log("\n");

    // Activate all restaurants
    const { error: updateError } = await supabaseAdmin
      .from("restaurants")
      .update({ is_active: true })
      .in(
        "id",
        inactive.map((r) => r.id),
      );

    if (updateError) {
      console.error("Error activating restaurants:", updateError);
      process.exit(1);
    }

    console.log(`✅ Activated ${inactive.length} restaurants!\n`);
  } else {
    console.log("✅ All restaurants are already active!\n");
  }

  // Verify
  const { data: verify } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, is_active")
    .eq("is_active", true);

  console.log(`✅ Total active restaurants: ${verify?.length || 0}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
