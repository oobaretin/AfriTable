#!/usr/bin/env tsx
/**
 * Find missing/broken restaurant websites via Google-style web search.
 * SerpAPI Google when quota allows; otherwise DuckDuckGo HTML (same intent as searching google.com).
 *
 * Usage:
 *   npm run discover:websites [--dry-run] [--limit=50] [--only-missing]
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  addressToSearchLine,
  resolveGoogleSearchUrl,
} from "../src/lib/google-search-url";
import { discoverRestaurantWebsite, hostMatchesRestaurantName } from "../src/lib/discover-restaurant-website";

config({ path: path.join(process.cwd(), ".env.local") });

const CATALOG_PATH = path.join(process.cwd(), "data", "restaurants.json");
const REPORT_PATH = path.join(process.cwd(), "data", "discover-websites-report.json");

function requireEnv(n: string) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

async function checkWebsite(url: string): Promise<boolean> {
  const bases = [url.startsWith("http") ? url : `https://${url}`];
  try {
    const u = new URL(bases[0]);
    if (!u.hostname.startsWith("www.")) {
      bases.push(`${u.protocol}//www.${u.hostname}${u.pathname}`);
    }
  } catch {
    /* ignore */
  }

  for (const target of bases) {
    try {
      const response = await fetch(target, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AfriTable/1.0)" },
        signal: AbortSignal.timeout(12000),
        redirect: "follow",
      });
      if (response.ok) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyMissing = process.argv.includes("--only-missing");
  const noSerpApi = process.argv.includes("--no-serpapi");
  /** missing URL or current URL does not match restaurant name (e.g. wrong DDG hit) */
  const needsWebsite = onlyMissing || process.argv.includes("--needs-website");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

  const serpKey = noSerpApi ? undefined : process.env.SERPAPI_KEY;
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as any[];
  const { data: dbRows } = await supabase.from("restaurants").select("id,slug,website").eq("is_active", true);
  const dbBySlug = new Map((dbRows ?? []).map((r) => [r.slug, r]));

  function needsDiscovery(r: { name: string; website?: string }): boolean {
    const w = String(r.website || "").trim();
    if (!w || w === "N/A") return true;
    try {
      const host = new URL(w.startsWith("http") ? w : `https://${w}`).hostname;
      return !hostMatchesRestaurantName(host, r.name);
    } catch {
      return true;
    }
  }

  const targets = catalog.filter((r) => (needsWebsite ? needsDiscovery(r) : true));

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    serpApiUsed: Boolean(serpKey),
    processed: 0,
    discovered: 0,
    validated: 0,
    failed: 0,
    results: [] as any[],
  };

  console.log(`Discovering websites for ${Math.min(limit, targets.length)} / ${targets.length} restaurants…\n`);

  function saveProgress() {
    if (!dryRun) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
    }
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  }

  for (const entry of targets) {
    if (report.processed >= limit) break;

    const addressLine = addressToSearchLine(entry.address);
    const name = entry.name;

    if (entry.website && needsDiscovery(entry)) {
      entry.website = undefined;
    }

    console.log(`[${report.processed + 1}] ${name}`);

    report.processed++;
    const row: any = { slug: entry.id, name, source: "pending", candidates: 0 };

    try {
      const { website, source, candidates, query } = await discoverRestaurantWebsite(name, addressLine, {
        serpApiKey: serpKey,
      });
      row.source = source;
      row.candidates = candidates;
      if (query) row.search_query = query;

      if (!website) {
        report.failed++;
        row.status = "not_found";
        console.log("  ⚠️  No website candidate\n");
        report.results.push(row);
        await new Promise((r) => setTimeout(r, 2200));
        saveProgress();
        continue;
      }

      const ok = await checkWebsite(website).catch(() => false);
      row.discovered_url = website;
      row.http_ok = ok;

      if (ok) {
        report.discovered++;
        report.validated++;
        row.status = "ok";
        entry.website = website;
        entry.google_search_url = resolveGoogleSearchUrl(entry);
        console.log(`  ✅ ${website} (${source})\n`);

        if (!dryRun) {
          const db = dbBySlug.get(entry.id);
          if (db) {
            await supabase.from("restaurants").update({ website }).eq("id", db.id);
          }
        }
      } else {
        report.failed++;
        row.status = "unreachable";
        console.log(`  ❌ Found but unreachable: ${website}\n`);
      }

      report.results.push(row);
    } catch (error) {
      report.failed++;
      row.status = "error";
      row.error = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Search error: ${row.error}\n`);
      report.results.push(row);
    }

    await new Promise((r) => setTimeout(r, 2200));
    saveProgress();
  }

  saveProgress();

  console.log("Website discovery complete");
  console.log(`  Processed:   ${report.processed}`);
  console.log(`  Discovered:  ${report.validated}`);
  console.log(`  Not found:   ${report.failed}`);
  console.log(`  Report:      ${REPORT_PATH}`);
  if (dryRun) console.log("\nDRY RUN — catalog not saved");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
