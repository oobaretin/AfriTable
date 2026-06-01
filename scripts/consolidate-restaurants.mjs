#!/usr/bin/env node
/**
 * Merge catalog (data/restaurants.json) into Supabase:
 * - Deduplicate by address fingerprint + google_place_id (NOT name-only)
 * - Enrich fields (description, story, hours, menu, social, ratings)
 * - Canonical slug = catalog.id when matched
 * - Activate catalog-backed rows with complete address + phone
 *
 * Usage: node scripts/consolidate-restaurants.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const REPORT_PATH = path.join(process.cwd(), "data", "consolidate-report.json");

config({ path: path.join(process.cwd(), ".env.local") });

const DAY_MAP = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseAddressLine(addr) {
  const s = String(addr || "").trim();
  const m = s.match(/^(.+),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5})/);
  if (m) {
    return { street: m[1].trim(), city: m[2].trim(), state: m[3], zip: m[4] };
  }
  return null;
}

function addressFingerprintFromObj(a) {
  if (!a || typeof a !== "object") return "";
  const street = String(a.street || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 48);
  const zip = String(a.zip || "")
    .replace(/\D/g, "")
    .slice(0, 5);
  const city = String(a.city || "").toLowerCase().trim();
  if (!street || !city) return "";
  return `${street}|${zip}|${city}`;
}

function catalogFingerprint(c) {
  return addressFingerprintFromObj(parseAddressLine(c.address));
}

function parsePriceRange(priceStr) {
  const n = (String(priceStr || "").match(/\$/g) || []).length;
  return Math.min(4, Math.max(1, n || 2));
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
        for (let i = startIdx; i <= 6; i++) {
          result.push({ day_of_week: i, open_time: openTime, close_time: closeTime });
        }
        for (let i = 0; i <= endIdx; i++) {
          result.push({ day_of_week: i, open_time: openTime, close_time: closeTime });
        }
      } else {
        for (let i = startIdx; i <= endIdx; i++) {
          result.push({ day_of_week: i, open_time: openTime, close_time: closeTime });
        }
      }
    }
  }
  return result;
}

function normalizeInstagram(v) {
  if (!v) return null;
  return String(v)
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "")
    .trim() || null;
}

function normalizeFacebook(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://www.facebook.com/${s.replace(/\s+/g, "")}`;
}

function isGenericDescription(d) {
  const s = String(d || "").toLowerCase();
  return (
    s.includes("discovered via serpapi") ||
    s.includes("listing sourced from public maps") ||
    s.length < 30
  );
}

function scoreRow(row, canonicalSlug) {
  let s = 0;
  if (row.slug === canonicalSlug) s += 10000;
  if (row.sources?.catalog_id === canonicalSlug) s += 9000;
  if (row.is_active) s += 500;
  s += (row.external_review_count || 0) * 3;
  s += (row.external_avg_rating || 0) * 20;
  if (row.our_story && row.our_story.length > 40) s += 300;
  if (row.website) s += 80;
  if (Array.isArray(row.hours) && row.hours.length > 0) s += 120;
  if (row.description && !isGenericDescription(row.description)) s += 150;
  if (!row.sources?.serpapi) s += 200;
  return s;
}

function pickRicher(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (typeof a === "string" && typeof b === "string") {
    if (isGenericDescription(a) && !isGenericDescription(b)) return b;
    if (!isGenericDescription(a) && isGenericDescription(b)) return a;
    return b.length > a.length ? b : a;
  }
  if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
  return a;
}

function mergeRowData(keeper, donor) {
  const patch = {};
  patch.phone = pickRicher(keeper.phone, donor.phone);
  patch.website = pickRicher(keeper.website, donor.website);
  patch.description = pickRicher(keeper.description, donor.description);
  patch.our_story = pickRicher(keeper.our_story, donor.our_story);
  patch.cultural_roots = pickRicher(keeper.cultural_roots, donor.cultural_roots);
  patch.instagram_handle = pickRicher(keeper.instagram_handle, donor.instagram_handle);
  patch.facebook_url = pickRicher(keeper.facebook_url, donor.facebook_url);
  patch.external_avg_rating = pickRicher(keeper.external_avg_rating, donor.external_avg_rating);
  patch.external_review_count = pickRicher(keeper.external_review_count, donor.external_review_count);

  const kh = Array.isArray(keeper.hours) ? keeper.hours.length : 0;
  const dh = Array.isArray(donor.hours) ? donor.hours.length : 0;
  if (dh > kh) patch.hours = donor.hours;

  const km = keeper.menu && Object.keys(keeper.menu).length;
  const dm = donor.menu && Object.keys(donor.menu).length;
  if (dm > km) patch.menu = donor.menu;

  const sources = { ...(donor.sources || {}), ...(keeper.sources || {}) };
  if (donor.sources?.google_place_id && !sources.google_place_id) {
    sources.google_place_id = donor.sources.google_place_id;
  }
  patch.sources = sources;

  return patch;
}

function buildCatalogPatch(catalog) {
  const addr = parseAddressLine(catalog.address);
  if (!addr?.street || !addr.city) return null;

  const hours = parseCatalogHours(catalog.hours || {});
  const menu = catalog.menu_highlights?.length
    ? { highlights: catalog.menu_highlights }
    : null;

  return {
    name: catalog.name,
    slug: catalog.id,
    cuisine_types: [catalog.cuisine, catalog.region].filter(Boolean),
    address: {
      ...addr,
      ...(catalog.lat != null && catalog.lng != null
        ? { coordinates: { lat: catalog.lat, lng: catalog.lng } }
        : {}),
    },
    phone: catalog.phone || null,
    website: catalog.website || null,
    instagram_handle: normalizeInstagram(catalog.social?.instagram),
    facebook_url: normalizeFacebook(catalog.social?.facebook),
    price_range: parsePriceRange(catalog.price_range),
    description: catalog.about || null,
    our_story: catalog.our_story || null,
    cultural_roots: catalog.cultural_roots || null,
    menu,
    hours: hours.length > 0 ? hours : null,
    external_avg_rating:
      typeof catalog.rating === "number" ? catalog.rating : undefined,
    sources: {
      catalog_id: catalog.id,
      catalog: true,
      ...(catalog.google_place_id ? { google_place_id: catalog.google_place_id } : {}),
    },
    is_active: !!(catalog.phone && addr.street && addr.city),
  };
}

function applyCatalogEnrichment(row, catalog) {
  const patch = buildCatalogPatch(catalog);
  if (!patch) return {};

  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === "slug" || k === "is_active") continue;
    if (v === null || v === undefined) continue;

    if (k === "description" && row.description && !isGenericDescription(row.description)) continue;
    if (k === "hours" && Array.isArray(row.hours) && row.hours.length > 0) continue;
    if (k === "our_story") {
      const catStory = catalog.our_story || "";
      if (catStory && (!row.our_story || row.our_story.length < catStory.length)) {
        out.our_story = catStory;
      }
      continue;
    }
    if (k === "cultural_roots") {
      const catRoots = catalog.cultural_roots || "";
      if (catRoots && (!row.cultural_roots || row.cultural_roots.length < catRoots.length)) {
        out.cultural_roots = catRoots;
      }
      continue;
    }
    if (k === "menu" && row.menu && Object.keys(row.menu).length > 0) continue;
    if (k === "phone" && row.phone && row.phone !== "000-000-0000") continue;
    if (k === "website" && row.website) continue;

    out[k] = v;
  }

  out.sources = {
    ...(row.sources || {}),
    ...(patch.sources || {}),
    catalog_id: catalog.id,
    catalog: true,
  };

  if (patch.is_active) out.is_active = true;

  return out;
}

async function deleteRestaurant(supabase, id, dryRun) {
  if (dryRun) return;
  await supabase.from("restaurant_tables").delete().eq("restaurant_id", id);
  await supabase.from("availability_settings").delete().eq("restaurant_id", id);
  await supabase.from("reservations").delete().eq("restaurant_id", id);
  await supabase.from("reviews").delete().eq("restaurant_id", id);
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) throw error;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const catalogPath = path.join(process.cwd(), "data", "restaurants.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const catalogByFp = new Map();
  for (const c of catalog) {
    const fp = catalogFingerprint(c);
    if (fp) catalogByFp.set(fp, c);
  }

  const { data: rows, error } = await supabase
    .from("restaurants")
    .select(
      "id,owner_id,name,slug,cuisine_types,address,display_city,phone,website,instagram_handle,facebook_url,price_range,description,our_story,cultural_roots,menu,hours,external_avg_rating,external_review_count,sources,is_active,created_at",
    );
  if (error) throw error;

  const report = {
    dryRun,
    startedAt: new Date().toISOString(),
    mergedGroups: [],
    deleted: [],
    slugRenamed: [],
    enriched: 0,
    activated: 0,
    errors: [],
  };

  const byFp = new Map();
  const byPlaceId = new Map();
  for (const r of rows) {
    const fp = addressFingerprintFromObj(r.address);
    if (fp) {
      if (!byFp.has(fp)) byFp.set(fp, []);
      byFp.get(fp).push(r);
    }
    const pid = r.sources?.google_place_id;
    if (pid) {
      if (!byPlaceId.has(pid)) byPlaceId.set(pid, []);
      byPlaceId.get(pid).push(r);
    }
  }

  const deleteIds = new Set();
  const pendingUpdates = new Map();

  function scheduleUpdate(id, patch) {
    const cur = pendingUpdates.get(id) || {};
    pendingUpdates.set(id, { ...cur, ...patch, sources: { ...(cur.sources || {}), ...(patch.sources || {}) } });
  }

  async function resolveGroup(group, reason) {
    if (group.length < 2) return;

    const fps = new Set(group.map((r) => addressFingerprintFromObj(r.address)));
    const catalogEntry =
      [...fps]
        .map((fp) => catalogByFp.get(fp))
        .find(Boolean) ||
      group
        .map((r) => catalogById.get(r.slug) || catalogById.get(r.sources?.catalog_id))
        .find(Boolean);

    const canonicalSlug = catalogEntry?.id || group.sort((a, b) => scoreRow(b, "") - scoreRow(a, ""))[0].slug;

    const sorted = [...group].sort((a, b) => scoreRow(b, canonicalSlug) - scoreRow(a, canonicalSlug));
    let keeper = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const donor = sorted[i];
      if (deleteIds.has(donor.id)) continue;
      const merged = mergeRowData(keeper, donor);
      scheduleUpdate(keeper.id, merged);
      keeper = { ...keeper, ...merged };
      deleteIds.add(donor.id);
      report.deleted.push({ slug: donor.slug, keeper: keeper.slug, reason });
    }

    if (catalogEntry) {
      scheduleUpdate(keeper.id, applyCatalogEnrichment(keeper, catalogEntry));
    }

    if (keeper.slug !== canonicalSlug) {
      const taken = rows.find((r) => r.slug === canonicalSlug && r.id !== keeper.id && !deleteIds.has(r.id));
      if (taken) {
        const merged = mergeRowData(keeper, taken);
        scheduleUpdate(keeper.id, merged);
        keeper = { ...keeper, ...merged };
        deleteIds.add(taken.id);
        report.deleted.push({ slug: taken.slug, keeper: keeper.slug, reason: "slug-collision" });
      }
      report.slugRenamed.push({ from: keeper.slug, to: canonicalSlug });
      scheduleUpdate(keeper.id, { slug: canonicalSlug });
      keeper = { ...keeper, slug: canonicalSlug };
    }

    report.mergedGroups.push({
      reason,
      canonicalSlug,
      kept: keeper.slug,
      removed: group.filter((g) => deleteIds.has(g.id)).map((g) => g.slug),
    });
  }

  for (const [fp, group] of byFp) {
    if (group.filter((g) => !deleteIds.has(g.id)).length > 1) {
      await resolveGroup(group.filter((g) => !deleteIds.has(g.id)), `address:${fp}`);
    }
  }

  for (const [pid, group] of byPlaceId) {
    const live = group.filter((g) => !deleteIds.has(g.id));
    if (live.length > 1) await resolveGroup(live, `place_id:${pid}`);
  }

  for (const [id, patch] of pendingUpdates) {
    if (dryRun) continue;
    const { error: upErr } = await supabase.from("restaurants").update(patch).eq("id", id);
    if (upErr) report.errors.push({ id, message: upErr.message });
  }

  for (const delId of deleteIds) {
    const row = rows.find((r) => r.id === delId);
    try {
      await deleteRestaurant(supabase, delId, dryRun);
    } catch (e) {
      report.errors.push({ slug: row?.slug, message: e.message });
    }
  }

  const { data: refreshed, error: refErr } = await supabase
    .from("restaurants")
    .select(
      "id,slug,address,phone,description,our_story,hours,menu,sources,is_active,website,instagram_handle,facebook_url,external_avg_rating,external_review_count,cuisine_types,price_range,cultural_roots,display_city",
    );
  if (refErr) throw refErr;

  const slugTaken = new Set((refreshed || []).map((r) => r.slug));

  for (const row of refreshed || []) {
    if (deleteIds.has(row.id)) continue;

    const catalog =
      catalogById.get(row.slug) ||
      catalogById.get(row.sources?.catalog_id) ||
      catalogByFp.get(addressFingerprintFromObj(row.address));

    if (!catalog) continue;

    if (row.slug !== catalog.id && !slugTaken.has(catalog.id)) {
      report.slugRenamed.push({ from: row.slug, to: catalog.id });
      slugTaken.delete(row.slug);
      slugTaken.add(catalog.id);
      if (!dryRun) {
        const { error: slugErr } = await supabase
          .from("restaurants")
          .update({ slug: catalog.id })
          .eq("id", row.id);
        if (slugErr) {
          report.errors.push({ slug: row.slug, message: slugErr.message });
          slugTaken.add(row.slug);
          slugTaken.delete(catalog.id);
          continue;
        }
      }
      row.slug = catalog.id;
    }

    const patch = applyCatalogEnrichment(row, catalog);
    if (Object.keys(patch).length === 0) continue;

    report.enriched++;
    if (patch.is_active && !row.is_active) report.activated++;

    if (dryRun) continue;
    const { error: upErr } = await supabase.from("restaurants").update(patch).eq("id", row.id);
    if (upErr) report.errors.push({ slug: row.slug, message: upErr.message });
  }

  report.missingCatalogIds = catalog
    .filter(
      (c) =>
        !(refreshed || []).some((r) => r.slug === c.id || r.sources?.catalog_id === c.id),
    )
    .map((c) => c.id);

  const { count: finalTotal } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true });
  const { count: finalActive } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  report.finishedAt = new Date().toISOString();
  report.finalTotal = finalTotal;
  report.finalActive = finalActive;

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(dryRun ? "DRY RUN — no writes" : "Consolidation complete");
  console.log(`  Merged groups:  ${report.mergedGroups.length}`);
  console.log(`  Deleted dupes:  ${report.deleted.length}`);
  console.log(`  Slug renames:   ${report.slugRenamed.length}`);
  console.log(`  Enriched:       ${report.enriched}`);
  console.log(`  Activated:      ${report.activated}`);
  console.log(`  DB total:       ${finalTotal} (${finalActive} active)`);
  console.log(`  Report:         ${REPORT_PATH}`);
  if (report.errors.length) console.log(`  Errors:         ${report.errors.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
