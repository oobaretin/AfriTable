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

function getAddressString(address) {
  if (!address || typeof address !== "object") return "";
  const street = address.street || "";
  const city = address.city || "";
  return `${street} ${city}`.trim().toLowerCase();
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Finding duplicate restaurants...\n");

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

  console.log(`📊 Total restaurants: ${restaurants.length}\n`);

  // Same name in different cities is NOT a duplicate — require name + address
  console.log("🔍 Checking for duplicates by name + address...\n");
  const byAddressName = new Map();
  for (const r of restaurants) {
    const key = `${normalizeName(r.name)}|${getAddressString(r.address)}`;
    if (key.endsWith("|")) continue;
    if (!byAddressName.has(key)) byAddressName.set(key, []);
    byAddressName.get(key).push(r);
  }

  const duplicates = [];
  for (const [key, group] of byAddressName.entries()) {
    if (group.length > 1) duplicates.push({ key, group });
  }

  if (duplicates.length === 0) {
    console.log("✅ No duplicates found by name + address!\n");
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate groups:\n`);

  for (const { key, group } of duplicates) {
    console.log(`📌 "${group[0].name}" (${group.length} entries)`);
    group.forEach((r, i) => {
      const addr = getAddressString(r.address);
      console.log(`   ${i + 1}. ${r.slug}`);
      console.log(`      Address: ${addr || "No address"}`);
      console.log(`      Phone: ${r.phone || "N/A"}`);
      console.log(`      Website: ${r.website || "N/A"}`);
      console.log(`      Rating: ${r.external_avg_rating || "N/A"} (${r.external_review_count || 0} reviews)`);
      console.log(`      Created: ${r.created_at}`);
      console.log(`      Active: ${r.is_active ? "Yes" : "No"}`);
      console.log();
    });
  }

  // Determine which to keep (prefer: more data, better rating, older, active)
  const toDelete = [];
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

    // Keep the first one, mark others for deletion
    const keep = sorted[0];
    console.log(`✅ Keeping: ${keep.slug} (best candidate)`);
    for (let i = 1; i < sorted.length; i++) {
      toDelete.push(sorted[i]);
      console.log(`   ❌ Will delete: ${sorted[i].slug}`);
    }
    console.log();
  }

  if (toDelete.length === 0) {
    console.log("✅ No duplicates to remove.\n");
    return;
  }

  console.log(`\n📋 Summary: ${toDelete.length} duplicate(s) to remove\n`);
  console.log("Duplicates to delete:");
  toDelete.forEach((r) => {
    console.log(`  - ${r.name} (${r.slug})`);
  });

  console.log("\n⚠️  Run with --delete flag to actually remove duplicates:");
  console.log("   npm run find:duplicates -- --delete\n");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
