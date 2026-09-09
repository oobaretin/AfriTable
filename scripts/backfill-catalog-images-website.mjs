#!/usr/bin/env node
/**
 * Backfill catalog photos from restaurant websites (og:image, JSON-LD, hero imgs).
 * Free tier — no SerpAPI. Targets listings missing Google venue photos.
 *
 * Usage:
 *   node scripts/backfill-catalog-images-website.mjs [--dry-run] [--limit 50] [--concurrency 6]
 */
import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "restaurants.json");
const reportPath = path.join(root, "data", "backfill-website-images-report.json");

const STOCK_PREFIX = "https://images.unsplash.com/";
const BRAND = ["/restaurant-card-placeholder.svg", "/og-image.svg"];
const STREET_RE =
  /streetviewpixels-pa\.googleapis\.com|maps\.googleapis\.com\/maps\/api\/streetview|googlestreetview/i;

const BLOCKED_WEBSITE = [
  "instagram.com",
  "facebook.com",
  "google.com",
  "goo.gl",
  "yelp.com",
  "tripadvisor.",
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "opentable.com",
  "resy.com",
  "linktr.ee",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "maps.app.goo.gl",
];

const SKIP_IMG_RE =
  /favicon|sprite|logo|icon|avatar|badge|pixel|spacer|1x1|tracking|analytics|emoji|social-share/i;

const GOOD_IMG_RE =
  /upload|hero|banner|gallery|wp-content|cloudinary|squarespace|wixstatic|static\.wix|cdn\.|assets\.|media\.|photos?|images?|dish|food|restaurant|interior|exterior|menu/i;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  let limit = Infinity;
  let concurrency = 6;
  let maxPhotos = 3;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) {
      limit = Math.max(1, parseInt(argv[i + 1], 10) || 1);
      i++;
    } else if (argv[i] === "--concurrency" && argv[i + 1]) {
      concurrency = Math.min(12, Math.max(1, parseInt(argv[i + 1], 10) || 6));
      i++;
    } else if (argv[i] === "--photos" && argv[i + 1]) {
      maxPhotos = Math.min(5, Math.max(1, parseInt(argv[i + 1], 10) || 3));
      i++;
    }
  }
  return { dryRun, limit, concurrency, maxPhotos };
}

function hasGoogleVenuePhoto(images) {
  return (images ?? []).some((raw) => {
    const u = String(raw ?? "").trim();
    return u.includes("googleusercontent.com") && !STREET_RE.test(u);
  });
}

function normalizeWebsite(raw) {
  let url = String(raw ?? "").trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_WEBSITE.some((b) => host.includes(b.replace(/\.$/, "")))) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function resolveUrl(raw, base) {
  const s = String(raw ?? "").trim();
  if (!s || s.startsWith("data:")) return null;
  try {
    return new URL(s, base).toString();
  } catch {
    return null;
  }
}

function decodeHtml(s) {
  return String(s ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMetaImages(html, baseUrl) {
  const found = [];
  const push = (raw) => {
    const url = resolveUrl(decodeHtml(raw), baseUrl);
    if (url) found.push(url);
  };

  for (const m of html.matchAll(
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url|:url)?|twitter:image(?::src)?)["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
  )) {
    push(m[1]);
  }
  for (const m of html.matchAll(
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image(?::secure_url|:url)?|twitter:image(?::src)?)["'][^>]*>/gi,
  )) {
    push(m[1]);
  }
  for (const m of html.matchAll(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi)) {
    push(m[1]);
  }

  for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(block[1]);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const img = node.image ?? node.photo ?? node.thumbnailUrl;
        if (typeof img === "string") push(img);
        else if (Array.isArray(img)) img.forEach((x) => typeof x === "string" && push(x));
        else if (img && typeof img === "object" && img.url) push(img.url);
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  }

  return found;
}

function extractContentImages(html, baseUrl, max = 3) {
  const found = [];
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const url = resolveUrl(decodeHtml(m[1]), baseUrl);
    if (!url) continue;
    const lower = url.toLowerCase();
    if (SKIP_IMG_RE.test(lower)) continue;
    if (/\.(svg|gif)(\?|$)/i.test(lower)) continue;
    if (!GOOD_IMG_RE.test(lower) && !/\.(jpe?g|png|webp)(\?|$)/i.test(lower)) continue;
    found.push(url);
    if (found.length >= max) break;
  }
  return found;
}

function scoreCandidate(url) {
  const lower = url.toLowerCase();
  let score = 0;
  if (/og|hero|banner|featured|cover|restaurant|interior|exterior|food|dish|gallery/.test(lower)) score += 3;
  if (/logo|icon|thumb-small|avatar/.test(lower)) score -= 5;
  if (/wp-content\/uploads|cloudinary|wixstatic|squarespace-cdn/.test(lower)) score += 2;
  if (/\.webp|\.jpe?g|\.png/.test(lower)) score += 1;
  return score;
}

function pickImages(html, pageUrl, maxPhotos) {
  const meta = extractMetaImages(html, pageUrl);
  const content = extractContentImages(html, pageUrl, maxPhotos);
  const ranked = [...meta, ...content]
    .filter((u, i, arr) => arr.indexOf(u) === i)
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  return ranked.slice(0, maxPhotos);
}

function fetchPage(url, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        timeout: timeoutMs,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = resolveUrl(res.headers.location, url);
          res.resume();
          if (next && next !== url) {
            fetchPage(next, timeoutMs).then(resolve);
            return;
          }
        }
        if (res.statusCode !== 200) {
          res.resume();
          resolve({ ok: false, status: res.statusCode, html: "" });
          return;
        }
        let html = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          html += chunk;
          if (html.length > 600_000) req.destroy();
        });
        res.on("end", () => resolve({ ok: true, status: 200, html, finalUrl: url }));
        res.on("close", () => resolve({ ok: true, status: 200, html, finalUrl: url }));
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: "timeout", html: "" });
    });
    req.on("error", (err) => resolve({ ok: false, status: "error", error: err.message, html: "" }));
    req.end();
  });
}

function validateImage(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve(false);
      return;
    }
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        timeout: timeoutMs,
        headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*", Range: "bytes=0-2048" },
      },
      (res) => {
        const ct = String(res.headers["content-type"] || "").toLowerCase();
        const ok = res.statusCode >= 200 && res.statusCode < 400 && ct.startsWith("image/");
        res.destroy();
        resolve(ok);
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
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
  const { dryRun, limit, concurrency, maxPhotos } = parseArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  const candidates = catalog.filter((entry) => {
    if (hasGoogleVenuePhoto(entry.images)) return false;
    return Boolean(normalizeWebsite(entry.website));
  });

  const batch = candidates.slice(0, Number.isFinite(limit) ? limit : candidates.length);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    eligible: candidates.length,
    processed: batch.length,
    updated: 0,
    noImages: 0,
    fetchFailed: 0,
    details: [],
  };

  console.log("Website image backfill (Tier A)\n");
  console.log(`  Eligible: ${candidates.length}`);
  console.log(`  This run: ${batch.length}`);
  console.log(`  Dry run:  ${dryRun ? "yes" : "no"}\n`);

  const results = await mapPool(batch, concurrency, async (entry) => {
    const website = normalizeWebsite(entry.website);
    const line = `${entry.name} (${entry.id})`;
    if (!website) {
      return { entry, status: "bad_website" };
    }

    const page = await fetchPage(website);
    if (!page.ok || !page.html) {
      console.log(`  ✗ ${line} — page ${page.status}${page.error ? ` (${page.error})` : ""}`);
      return { entry, status: "fetch_failed", website, pageStatus: page.status };
    }

    const picks = pickImages(page.html, page.finalUrl || website, maxPhotos);
    const valid = [];
    for (const url of picks) {
      if (await validateImage(url)) valid.push(url);
      if (valid.length >= maxPhotos) break;
    }

    if (!valid.length) {
      console.log(`  – ${line} — no usable images`);
      return { entry, status: "no_images", website };
    }

    console.log(`  ✓ ${line} — ${valid.length} image(s)`);
    return { entry, status: "updated", website, images: valid };
  });

  for (const result of results) {
    report.details.push({
      id: result.entry.id,
      name: result.entry.name,
      status: result.status,
      website: result.website,
      imageCount: result.images?.length ?? 0,
    });

    if (result.status === "updated" && result.images?.length) {
      report.updated++;
      if (!dryRun) result.entry.images = result.images;
    } else if (result.status === "fetch_failed") {
      report.fetchFailed++;
    } else {
      report.noImages++;
    }
  }

  console.log("\nSummary");
  console.log(`  Updated:      ${report.updated}`);
  console.log(`  No images:    ${report.noImages}`);
  console.log(`  Fetch failed: ${report.fetchFailed}`);
  console.log(`  Remaining:    ${Math.max(0, candidates.length - batch.length)}`);

  if (!dryRun && report.updated > 0) {
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
    console.log(`\nWrote ${catalogPath}`);
  } else if (dryRun) {
    console.log("\nDry run — catalog not written");
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
