#!/usr/bin/env node
/**
 * Quality pass: fill hours, enrich from catalog, deactivate clear orphan dupes.
 * Usage: node scripts/run-quality-pass.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

const DAY_MAP = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

const DEFAULT_HOURS_CATALOG = {
  mon_sat: "11:00 AM - 9:00 PM",
  sun: "12:00 PM - 8:00 PM",
};

/** Serp duplicate slug → canonical catalog slug (same brand; catalog is primary). */
const DEACTIVATE_ORPHANS = {
  "baobab-fare-detroit": "det-001",
  "dakar-nola-new-orleans": "nola-dakar",
};

/** Broken geocode / address rows — hide from site, no canonical replacement. */
const DEACTIVATE_BAD_ADDRESS = ["teranga-4-embarcadero-ctr"];

function requireEnv(n) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

function toHHmm(timeStr) {
  if (!timeStr) return null;
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  const match = String(timeStr).match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2] || "0", 10);
  const period = match[3]?.toLowerCase();
  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseCatalogHours(hoursObj) {
  const result = [];
  if (!hoursObj || typeof hoursObj !== "object") return result;
  for (const [key, value] of Object.entries(hoursObj)) {
    if (value === "Closed" || !value) continue;
    const timeMatch = String(value).match(
      /(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}:?\d{0,2}\s*(?:am|pm)?)/i,
    );
    if (!timeMatch) continue;
    const openTime = toHHmm(timeMatch[1]);
    const closeTime = toHHmm(timeMatch[2]);
    if (!openTime || !closeTime) continue;
    const days = key.toLowerCase().split("_");
    if (days.length === 1 && DAY_MAP[days[0]] !== undefined) {
      result.push({ day_of_week: DAY_MAP[days[0]], open_time: openTime, close_time: closeTime });
    } else if (days.length === 2) {
      const startIdx = DAY_MAP[days[0]];
      const endIdx = DAY_MAP[days[1]];
      if (startIdx === undefined || endIdx === undefined) continue;
      if (startIdx > endIdx) {
        for (let i = startIdx; i <= 6; i++) result.push({ day_of_week: i, open_time: openTime, close_time: closeTime });
        for (let i = 0; i <= endIdx; i++) result.push({ day_of_week: i, open_time: openTime, close_time: closeTime });
      } else {
        for (let i = startIdx; i <= endIdx; i++) result.push({ day_of_week: i, open_time: openTime, close_time: closeTime });
      }
    }
  }
  return result;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "restaurants.json"), "utf8"));
  const catalogById = new Map(catalog.map((c) => [c.id, c]));

  const { data: rows } = await supabase
    .from("restaurants")
    .select("id,slug,name,hours,sources,description,phone,our_story,cultural_roots,website,menu")
    .eq("is_active", true);

  let hoursFixed = 0;
  let deactivated = 0;

  for (const r of rows ?? []) {
    if (DEACTIVATE_BAD_ADDRESS.includes(r.slug)) {
      if (!dryRun) await supabase.from("restaurants").update({ is_active: false }).eq("id", r.id);
      console.log(`  Deactivate bad address: ${r.slug}`);
      deactivated++;
      continue;
    }

    if (DEACTIVATE_ORPHANS[r.slug]) {
      const canonical = DEACTIVATE_ORPHANS[r.slug];
      const { data: keeper } = await supabase.from("restaurants").select("id").eq("slug", canonical).maybeSingle();
      if (keeper) {
        if (!dryRun) await supabase.from("restaurants").update({ is_active: false }).eq("id", r.id);
        console.log(`  Deactivate orphan: ${r.slug} → canonical ${canonical}`);
        deactivated++;
        continue;
      }
    }

    const cat = catalogById.get(r.slug) || catalogById.get(r.sources?.catalog_id);
    const hasHours = Array.isArray(r.hours) && r.hours.length > 0;
    if (hasHours) continue;

    let hours = cat ? parseCatalogHours(cat.hours || {}) : [];
    if (!hours.length) hours = parseCatalogHours(DEFAULT_HOURS_CATALOG);

    if (!hours.length) continue;

    if (!dryRun) {
      await supabase.from("restaurants").update({ hours }).eq("id", r.id);
    }
    console.log(`  Hours set: ${r.slug} (${hours.length} day rows)`);
    hoursFixed++;
  }

  console.log(dryRun ? "\nDRY RUN" : "\nDone");
  console.log(`  Hours updated:    ${hoursFixed}`);
  console.log(`  Orphans off:      ${deactivated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
