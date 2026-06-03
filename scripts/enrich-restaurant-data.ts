#!/usr/bin/env tsx
/**
 * Enrich restaurant catalog + Supabase: normalize hours, scrape websites, validate URLs.
 *
 * Usage:
 *   tsx scripts/enrich-restaurant-data.ts [--dry-run] [--limit N] [--skip-websites]
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  isPlaceholderHours,
  normalizeCatalogHoursObject,
  parseCatalogHoursToArray,
  type OperatingHour,
} from "../src/lib/parse-catalog-hours";
import { resolveGoogleSearchUrl, addressToSearchLine } from "../src/lib/google-search-url";
import { discoverRestaurantWebsite } from "../src/lib/discover-restaurant-website";

config({ path: path.join(process.cwd(), ".env.local") });

const CATALOG_PATH = path.join(process.cwd(), "data", "restaurants.json");
const REPORT_PATH = path.join(process.cwd(), "data", "enrich-report.json");

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function requireEnv(n: string) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

function toHHmm(timeStr: string): string | null {
  const raw = String(timeStr || "").trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2] || "0", 10);
  const period = match[3]?.toLowerCase();
  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseHoursFromHtml(text: string): OperatingHour[] {
  const hours: OperatingHour[] = [];
  try {
    const jsonLdMatches = text.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>|<\/script>/gi, "");
          const json = JSON.parse(jsonStr);
          const items = Array.isArray(json) ? json : [json];
          for (const item of items) {
            if (!["Restaurant", "FoodEstablishment", "LocalBusiness"].includes(item["@type"])) continue;
            if (item.openingHoursSpecification) {
              const specs = Array.isArray(item.openingHoursSpecification)
                ? item.openingHoursSpecification
                : [item.openingHoursSpecification];
              for (const spec of specs) {
                const days = Array.isArray(spec.dayOfWeek) ? spec.dayOfWeek : [spec.dayOfWeek];
                for (const day of days) {
                  const dayName = String(day).replace(/.*schema.org\//, "").toLowerCase();
                  if (DAY_MAP[dayName] === undefined) continue;
                  const open = toHHmm(spec.opens);
                  const close = toHHmm(spec.closes);
                  if (open && close) {
                    hours.push({ day_of_week: DAY_MAP[dayName], open_time: open, close_time: close });
                  }
                }
              }
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  return hours;
}

async function scrapeWebsiteHours(url: string): Promise<OperatingHour[] | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AfriTable/1.0; +https://afri-table.com)" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!response.ok) return null;
    const html = await response.text();
    const parsed = parseHoursFromHtml(html);
    return parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

async function checkWebsite(url: string): Promise<{ ok: boolean; status?: number }> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AfriTable/1.0)" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false };
  }
}

function ensureGoogleSearchLink(entry: {
  name: string;
  address?: unknown;
  google_search_url?: string;
  google_maps_url?: string;
}) {
  entry.google_search_url = resolveGoogleSearchUrl(entry);
  delete entry.google_maps_url;
}

function isGenericStory(s: string | undefined) {
  return (
    !s ||
    s.length < 40 ||
    /listing sourced from public maps|discovered via serpapi|verify hours and menu/i.test(s)
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const skipWebsites = process.argv.includes("--skip-websites");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as any[];
  const { data: dbRows } = await supabase
    .from("restaurants")
    .select("id,slug,hours,website,description,our_story,phone")
    .eq("is_active", true);
  const dbBySlug = new Map((dbRows ?? []).map((r) => [r.slug, r]));

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    hoursNormalized: 0,
    hoursFromWebsite: 0,
    websitesBroken: 0,
    websitesOk: 0,
    googleSearchLinks: 0,
    supabaseUpdated: 0,
    details: [] as any[],
  };

  let processed = 0;

  for (const entry of catalog) {
    if (processed >= limit) break;

    const slug = entry.id;
    const db = dbBySlug.get(slug);
    const detail: any = { slug, name: entry.name, actions: [] };

    let hoursArray = parseCatalogHoursToArray(entry.hours);
    let catalogHoursObj = entry.hours;

    // Step 1: normalize placeholder catalog strings
    if (isPlaceholderHours(entry.hours) || !hoursArray.length) {
      const normalized = normalizeCatalogHoursObject(entry.hours);
      hoursArray = parseCatalogHoursToArray(normalized);
      if (hoursArray.length) {
        catalogHoursObj = normalized;
        entry.hours = normalized;
        detail.actions.push("normalized_placeholder");
        report.hoursNormalized++;
      } else if (db?.hours) {
        hoursArray = parseCatalogHoursToArray(db.hours);
        if (hoursArray.length) {
          catalogHoursObj = normalizeCatalogHoursObject(db.hours);
          entry.hours = catalogHoursObj;
          detail.actions.push("copied_from_db");
          report.hoursNormalized++;
        }
      }
    }

    processed++;

    // Step 2: website validation + optional hours scrape
    let website = String(entry.website || db?.website || "").trim();
    if (website && website !== "N/A") {
      if (!/^https?:\/\//i.test(website)) website = `https://${website}`;

      if (!skipWebsites) {
        const check = await checkWebsite(website);
        if (check.ok) {
          report.websitesOk++;
          detail.websiteStatus = "ok";
          const scraped = await scrapeWebsiteHours(website);
          if (scraped && scraped.length >= hoursArray.length) {
            hoursArray = scraped;
            catalogHoursObj = normalizeCatalogHoursObject(scraped);
            entry.hours = catalogHoursObj;
            detail.actions.push("hours_from_website");
            report.hoursFromWebsite++;
          }
          await new Promise((r) => setTimeout(r, 800));
        } else {
          report.websitesBroken++;
          detail.websiteStatus = "broken";
          detail.actions.push("website_broken");

          const discovered = await discoverRestaurantWebsite(entry.name, addressToSearchLine(entry.address), {
            serpApiKey: process.env.SERPAPI_KEY,
          });
          if (discovered.website) {
            const ok = await checkWebsite(discovered.website);
            if (ok) {
              entry.website = discovered.website;
              detail.actions.push(`website_discovered_${discovered.source}`);
              report.websitesOk++;
              report.websitesBroken--;
            } else {
              entry.website = undefined;
              detail.actions.push("website_discovered_unreachable");
            }
          } else {
            entry.website = undefined;
          }

          ensureGoogleSearchLink(entry);
          if (!entry.website) {
            detail.actions.push("google_search_fallback");
            report.googleSearchLinks++;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }

    ensureGoogleSearchLink(entry);

    // Step 3: enrich thin copy from DB when available
    if (isGenericStory(entry.our_story) && db?.our_story && !isGenericStory(db.our_story)) {
      entry.our_story = db.our_story;
      detail.actions.push("story_from_db");
    }
    if ((!entry.about || entry.about.length < 50) && db?.description && db.description.length >= 50) {
      entry.about = db.description;
      detail.actions.push("about_from_db");
    }

    // Step 4: sync Supabase
    if (db && hoursArray.length && !dryRun) {
      await supabase.from("restaurants").update({ hours: hoursArray, website: entry.website || null }).eq("id", db.id);

      const { data: settings } = await supabase
        .from("availability_settings")
        .select("id,operating_hours")
        .eq("restaurant_id", db.id)
        .maybeSingle();

      const existing = Array.isArray(settings?.operating_hours) ? settings.operating_hours.length : 0;
      if (!existing) {
        if (settings?.id) {
          await supabase.from("availability_settings").update({ operating_hours: hoursArray }).eq("id", settings.id);
        } else {
          await supabase.from("availability_settings").insert({
            restaurant_id: db.id,
            operating_hours: hoursArray,
          });
        }
        detail.actions.push("availability_synced");
      }
      report.supabaseUpdated++;
    }

    if (detail.actions.length) report.details.push(detail);
  }

  if (!dryRun) {
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("Restaurant enrichment");
  console.log(`  Hours normalized:     ${report.hoursNormalized}`);
  console.log(`  Hours from websites:  ${report.hoursFromWebsite}`);
  console.log(`  Websites OK / broken: ${report.websitesOk} / ${report.websitesBroken}`);
  console.log(`  Google search links:  ${report.googleSearchLinks}`);
  console.log(`  Supabase updated:     ${report.supabaseUpdated}`);
  console.log(`  Report: ${REPORT_PATH}`);
  if (dryRun) console.log("\nDRY RUN — catalog not written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
