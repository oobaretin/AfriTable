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

function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Finding and removing duplicate restaurants...\n");

  // Get all restaurants with full details
  const { data: restaurants, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, address, phone, website, external_avg_rating, external_review_count, created_at, is_active")
    .order("name");

  if (error) {
    console.error("❌ Error fetching restaurants:", error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log("❌ No restaurants found.");
    process.exit(1);
  }

  function getAddressString(address) {
    if (!address || typeof address !== "object") return "";
    return `${address.street || ""} ${address.city || ""}`.trim().toLowerCase();
  }

  const byAddressName = new Map();
  for (const r of restaurants) {
    const key = `${normalizeName(r.name)}|${getAddressString(r.address)}`;
    if (key.endsWith("|")) continue;
    if (!byAddressName.has(key)) byAddressName.set(key, []);
    byAddressName.get(key).push(r);
  }

  const duplicates = [];
  for (const [, group] of byAddressName.entries()) {
    if (group.length > 1) duplicates.push({ group });
  }

  if (duplicates.length === 0) {
    console.log("✅ No duplicates found!\n");
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate groups\n`);

  // Determine which to keep and delete
  const toDelete = [];
  const toKeep = [];

  for (const { group } of duplicates) {
    // Sort by: active first, then by rating (higher), then by review count, then by creation date (older)
    const sorted = [...group].sort((a, b) => {
      if (a.is_active !== b.is_active) return b.is_active - a.is_active;
      const ratingA = a.external_avg_rating || 0;
      const ratingB = b.external_avg_rating || 0;
      if (Math.abs(ratingA - ratingB) > 0.1) return ratingB - ratingA;
      const reviewsA = a.external_review_count || 0;
      const reviewsB = b.external_review_count || 0;
      if (reviewsA !== reviewsB) return reviewsB - reviewsA;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    // Keep the first one
    const keep = sorted[0];
    toKeep.push(keep);
    console.log(`✅ Keeping: ${keep.name} (${keep.slug})`);

    // Mark others for deletion
    for (let i = 1; i < sorted.length; i++) {
      toDelete.push(sorted[i]);
      console.log(`   ❌ Deleting: ${sorted[i].name} (${sorted[i].slug})`);
    }
    console.log();
  }

  if (toDelete.length === 0) {
    console.log("✅ No duplicates to remove.\n");
    return;
  }

  console.log(`\n🗑️  Removing ${toDelete.length} duplicate(s)...\n`);

  // Delete duplicates (cascade will handle related tables)
  let deleted = 0;
  let errors = 0;

  for (const restaurant of toDelete) {
    // First, delete related data
    await supabaseAdmin.from("restaurant_tables").delete().eq("restaurant_id", restaurant.id);
    await supabaseAdmin.from("availability_settings").delete().eq("restaurant_id", restaurant.id);
    await supabaseAdmin.from("reservations").delete().eq("restaurant_id", restaurant.id);
    await supabaseAdmin.from("reviews").delete().eq("restaurant_id", restaurant.id);

    // Then delete the restaurant
    const { error: deleteError } = await supabaseAdmin
      .from("restaurants")
      .delete()
      .eq("id", restaurant.id);

    if (deleteError) {
      console.error(`   ❌ Error deleting ${restaurant.slug}:`, deleteError.message);
      errors++;
    } else {
      console.log(`   ✅ Deleted: ${restaurant.name} (${restaurant.slug})`);
      deleted++;
    }
  }

  console.log(`\n✅ Removed ${deleted} duplicate(s)`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} error(s) occurred`);
  }

  // Verify final count
  const { data: final } = await supabaseAdmin
    .from("restaurants")
    .select("id", { count: "exact" });

  console.log(`\n📊 Final restaurant count: ${final?.length || 0}\n`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
