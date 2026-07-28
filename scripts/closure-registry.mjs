#!/usr/bin/env node
/**
 * Closed restaurant registry — audit catalog/Supabase drift and apply deactivations.
 *
 * Usage:
 *   node scripts/closure-registry.mjs audit
 *   node scripts/closure-registry.mjs apply [--dry-run]
 *
 * Source of truth for removed listings: data/closed-restaurants.json
 * Public catalog: data/restaurants.json (must not contain registry slugs)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REGISTRY_PATH = join(ROOT, "data", "closed-restaurants.json");
const CATALOG_PATH = join(ROOT, "data", "restaurants.json");

config({ path: join(ROOT, ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function loadRegistry() {
  const raw = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const entries = raw.entries ?? [];
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  return { meta: raw, entries, bySlug };
}

function loadCatalogIds() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  return new Set(catalog.map((r) => r.id));
}

async function fetchSupabaseRows(supabase, slugs) {
  if (!slugs.length) return [];
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,slug,name,is_active")
    .in("slug", slugs);
  if (error) throw error;
  return data ?? [];
}

async function audit() {
  const { entries } = loadRegistry();
  const catalogIds = loadCatalogIds();
  const slugs = entries.map((e) => e.slug);

  const inCatalog = slugs.filter((s) => catalogIds.has(s));
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
  const rows = await fetchSupabaseRows(supabase, slugs);
  const rowBySlug = new Map(rows.map((r) => [r.slug, r]));

  const missingInDb = slugs.filter((s) => !rowBySlug.has(s));
  const stillActive = slugs.filter((s) => rowBySlug.get(s)?.is_active === true);
  const okInactive = slugs.filter((s) => rowBySlug.get(s)?.is_active === false);

  console.log("Closed restaurant registry audit");
  console.log(`  Registry entries:     ${entries.length}`);
  console.log(`  In catalog (BAD):     ${inCatalog.length}`);
  console.log(`  Supabase inactive OK: ${okInactive.length}`);
  console.log(`  Supabase still active (DRIFT): ${stillActive.length}`);
  console.log(`  Not in Supabase:      ${missingInDb.length}`);

  if (inCatalog.length) {
    console.log("\n  Still in restaurants.json:");
    inCatalog.forEach((s) => console.log(`    - ${s}`));
  }
  if (stillActive.length) {
    console.log("\n  Active in Supabase but in closed registry:");
    stillActive.forEach((s) => {
      const row = rowBySlug.get(s);
      console.log(`    - ${s} (${row?.name})`);
    });
  }
  if (missingInDb.length) {
    console.log("\n  Registry only (no Supabase row):");
    missingInDb.forEach((s) => console.log(`    - ${s}`));
  }

  const exitCode = inCatalog.length || stillActive.length ? 1 : 0;
  process.exit(exitCode);
}

async function apply() {
  const dryRun = process.argv.includes("--dry-run");
  const { entries } = loadRegistry();
  const slugs = entries.map((e) => e.slug);

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const rows = await fetchSupabaseRows(supabase, slugs);
  const toDeactivate = rows.filter((r) => r.is_active);

  console.log(`Apply closed registry${dryRun ? " (dry run)" : ""}`);
  console.log(`  Candidates: ${toDeactivate.length}`);

  for (const row of toDeactivate) {
    const entry = entries.find((e) => e.slug === row.slug);
    const label = entry?.closure_type ?? "unknown";
    console.log(`  ${dryRun ? "[dry-run]" : "→"} ${row.slug} (${label})`);
    if (!dryRun) {
      const { error } = await supabase
        .from("restaurants")
        .update({ is_active: false })
        .eq("id", row.id);
      if (error) console.warn(`    error: ${error.message}`);
    }
  }

  if (!dryRun && toDeactivate.length) {
    const meta = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
    meta.last_applied_at = new Date().toISOString();
    writeFileSync(REGISTRY_PATH, JSON.stringify(meta, null, 2) + "\n", "utf8");
  }

  console.log("\nRun `node scripts/closure-registry.mjs audit` to verify.");
}

const cmd = process.argv[2] ?? "audit";
if (cmd === "audit") {
  audit().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (cmd === "apply") {
  apply().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.error("Usage: node scripts/closure-registry.mjs [audit|apply] [--dry-run]");
  process.exit(1);
}
