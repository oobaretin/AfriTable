#!/usr/bin/env node
/** Quality audit: hours, phone, description, legacy slugs, orphan candidates. */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(n) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

const ORPHAN_CANONICAL = {
  "baobab-fare-detroit": "det-001",
  "dakar-nola-new-orleans": "nola-dakar",
};

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "restaurants.json"), "utf8"));
  const catalogIds = new Set(catalog.map((c) => c.id));

  const { data: rows } = await supabase
    .from("restaurants")
    .select(
      "id,slug,name,phone,hours,description,address,sources,is_active,website,our_story",
    )
    .eq("is_active", true);

  const noHours = [];
  const noPhone = [];
  const shortDesc = [];
  const legacySlugs = [];
  const orphanCandidates = [];
  const badAddress = [];

  for (const r of rows ?? []) {
    if (!Array.isArray(r.hours) || !r.hours.length) noHours.push(r.slug);
    if (!r.phone || r.phone === "000-000-0000") noPhone.push(r.slug);
    if (!r.description || r.description.length < 50) shortDesc.push(r.slug);
    if (!catalogIds.has(r.slug) && !catalogIds.has(r.sources?.catalog_id)) {
      legacySlugs.push(r.slug);
    }
    if (ORPHAN_CANONICAL[r.slug]) orphanCandidates.push({ slug: r.slug, canonical: ORPHAN_CANONICAL[r.slug] });
    const city = String(r.address?.city || "");
    const zip = String(r.address?.zip || "");
    if (/^\d+\s/.test(city) || zip === "77000" || city.length < 2) badAddress.push(r.slug);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    activeCount: rows?.length ?? 0,
    catalogCount: catalog.length,
    noHours,
    noPhone,
    shortDesc,
    legacySlugs,
    orphanCandidates,
    badAddress,
  };

  const out = path.join(process.cwd(), "data", "quality-audit.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));

  console.log("Quality audit");
  console.log(`  Active restaurants: ${report.activeCount}`);
  console.log(`  Missing hours:      ${noHours.length}`);
  console.log(`  Missing phone:      ${noPhone.length}`);
  console.log(`  Short description:  ${shortDesc.length}`);
  console.log(`  Legacy slugs:       ${legacySlugs.length}`);
  console.log(`  Orphan candidates:  ${orphanCandidates.length}`);
  console.log(`  Bad address:        ${badAddress.length}`);
  console.log(`  Report: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
