#!/usr/bin/env node
/**
 * Probe catalog image URLs and remove dead links (403/404) from data/restaurants.json.
 * No SerpAPI — use before backfill to stop broken cards and surface working Street View.
 *
 * Usage:
 *   node scripts/validate-catalog-images.mjs [--dry-run] [--limit N] [--concurrency 8]
 */
import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "restaurants.json");
const reportPath = path.join(root, "data", "validate-images-report.json");

const STOCK_PREFIX = "https://images.unsplash.com/";
const BRAND = ["/restaurant-card-placeholder.svg", "/og-image.svg"];

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  let limit = Infinity;
  let concurrency = 8;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) {
      limit = Math.max(1, parseInt(argv[i + 1], 10) || 1);
      i++;
    } else if (argv[i] === "--concurrency" && argv[i + 1]) {
      concurrency = Math.min(20, Math.max(1, parseInt(argv[i + 1], 10) || 8));
      i++;
    }
  }
  return { dryRun, limit, concurrency };
}

function isSkippableUrl(url) {
  const u = String(url || "").trim();
  if (!u) return true;
  if (u.startsWith(STOCK_PREFIX)) return true;
  if (BRAND.some((b) => u === b || u.endsWith(b))) return true;
  return false;
}

function probeUrl(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        timeout: 12000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AfriTable/1.0; +https://afri-table.com)",
          Referer: "https://www.google.com/",
          Accept: "image/*,*/*",
        },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode }));
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: "timeout" });
    });
    req.on("error", (err) => resolve({ ok: false, status: "error", error: err.message }));
    req.end();
  });
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function main() {
  const { dryRun, limit, concurrency } = parseArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  const uniqueUrls = new Map();
  for (const entry of catalog) {
    for (const raw of entry.images ?? []) {
      const url = String(raw ?? "").trim();
      if (!url || isSkippableUrl(url)) continue;
      if (!uniqueUrls.has(url)) uniqueUrls.set(url, []);
      uniqueUrls.get(url).push(entry.id);
    }
  }

  const toProbe = [...uniqueUrls.keys()].slice(0, Number.isFinite(limit) ? limit : uniqueUrls.size);
  console.log(`Probing ${toProbe.length} unique image URL(s) (concurrency ${concurrency})…\n`);

  const probeResults = await mapPool(toProbe, concurrency, async (url) => {
    const result = await probeUrl(url);
    const tag = result.ok ? "OK" : String(result.status);
    if (!result.ok) console.log(`  ${tag}: ${url.slice(0, 90)}…`);
    return { url, ...result, restaurantIds: uniqueUrls.get(url) };
  });

  const dead = new Set(probeResults.filter((r) => !r.ok).map((r) => r.url));
  const alive = new Set(probeResults.filter((r) => r.ok).map((r) => r.url));

  let restaurantsTouched = 0;
  let urlsRemoved = 0;
  const details = [];

  for (const entry of catalog) {
    const before = entry.images ?? [];
    const after = before.filter((raw) => {
      const url = String(raw ?? "").trim();
      if (!url || isSkippableUrl(url)) return true;
      if (!toProbe.includes(url)) return true;
      if (dead.has(url)) {
        urlsRemoved++;
        return false;
      }
      return true;
    });
    if (after.length !== before.length) {
      restaurantsTouched++;
      details.push({
        id: entry.id,
        name: entry.name,
        removed: before.length - after.length,
        remaining: after.length,
      });
      entry.images = after.length ? after : undefined;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    uniqueUrlsInCatalog: uniqueUrls.size,
    probed: toProbe.length,
    alive: alive.size,
    dead: dead.size,
    restaurantsTouched,
    urlsRemoved,
    details: details.slice(0, 100),
  };

  console.log("\nSummary");
  console.log(`  Unique URLs:  ${uniqueUrls.size}`);
  console.log(`  Probed:       ${toProbe.length}`);
  console.log(`  Alive:        ${alive.size}`);
  console.log(`  Dead:         ${dead.size}`);
  console.log(`  Restaurants:  ${restaurantsTouched} updated`);
  console.log(`  URLs removed: ${urlsRemoved}`);

  if (!dryRun) {
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
    console.log(`\nWrote ${catalogPath}`);
  } else {
    console.log("\nDry run — catalog not written");
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
