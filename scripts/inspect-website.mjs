#!/usr/bin/env node
/**
 * Production website inspection — writes NDJSON to debug log for agent analysis.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.INSPECT_BASE_URL || "https://afri-table.com";
const LOG_PATH =
  process.env.DEBUG_LOG_PATH ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".cursor", "debug-3435b4.log");
const SESSION_ID = "3435b4";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/restaurants",
  "/join-as-restaurant",
  "/submit-restaurant",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/cookies",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
];

const PLACEHOLDER_MARKERS = [
  "yourprofile",
  "yourhandle",
  "via.placeholder.com",
  "placeholder text for MVP",
  "@afritable.com",
  "/api/placeholder/",
];

const RUN_ID = process.env.INSPECT_RUN_ID || "post-fix";

function log(hypothesisId, message, data = {}) {
  const line = JSON.stringify({
    sessionId: SESSION_ID,
    hypothesisId,
    location: "scripts/inspect-website.mjs",
    message,
    data,
    timestamp: Date.now(),
    runId: RUN_ID,
  });
  fs.appendFileSync(LOG_PATH, `${line}\n`);
}

async function fetchRoute(route) {
  const url = `${BASE}${route}`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AfriTable-Inspect/1.0" },
      redirect: "follow",
    });
    const text = await res.text();
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
    const markers = PLACEHOLDER_MARKERS.filter((m) => text.includes(m));
    const hasContactEmails = text.includes("@afri-table.com");
    const hasOldEmails = text.includes("@afritable.com");
    const duplicateBrandTitle =
      typeof titleMatch === "string" && (titleMatch.match(/\|\s*AfriTable/gi)?.length ?? 0) > 1;
    return {
      route,
      url,
      status: res.status,
      ok: res.ok,
      ms: Date.now() - started,
      contentType: res.headers.get("content-type") || "",
      markers,
      hasContactEmails,
      hasOldEmails,
      titleMatch,
      duplicateBrandTitle,
    };
  } catch (err) {
    return {
      route,
      url,
      status: 0,
      ok: false,
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sampleRestaurantRoute() {
  try {
    const res = await fetch(`${BASE}/restaurants`, {
      headers: { "User-Agent": "AfriTable-Inspect/1.0" },
    });
    const html = await res.text();
    const match = html.match(/href="(\/restaurants\/[^"?]+)"/);
    if (!match) return null;
    return fetchRoute(match[1]);
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, "");

  log("H0", "inspect_start", { base: BASE, routeCount: PUBLIC_ROUTES.length });

  const results = [];
  for (const route of PUBLIC_ROUTES) {
    const result = await fetchRoute(route);
    results.push(result);
    log("H1", "route_checked", result);
  }

  const restaurantDetail = await sampleRestaurantRoute();
  if (restaurantDetail) {
    results.push(restaurantDetail);
    log("H1", "restaurant_detail_sample", restaurantDetail);
  }

  const failed = results.filter((r) => !r.ok);
  const placeholders = results.filter((r) => r.markers?.length);
  const oldEmails = results.filter((r) => r.hasOldEmails);

  log("H2", "placeholder_scan_summary", {
    count: placeholders.length,
    routes: placeholders.map((r) => ({ route: r.route, markers: r.markers })),
  });

  log("H3", "http_failures_summary", {
    count: failed.length,
    routes: failed.map((r) => ({ route: r.route, status: r.status, error: r.error })),
  });

  log("H4", "email_domain_summary", {
    contactHasAfriTable: results.some((r) => r.hasContactEmails),
    pagesWithOldDomain: oldEmails.map((r) => r.route),
  });

  log("H5", "inspect_complete", {
    total: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: failed.length,
    placeholders: placeholders.length,
    duplicateTitles: results.filter((r) => r.duplicateBrandTitle).map((r) => r.route),
  });

  console.log(JSON.stringify({ base: BASE, failed, placeholders, oldEmails: oldEmails.map((r) => r.route) }, null, 2));
}

main().catch((err) => {
  log("H0", "inspect_crash", { error: err instanceof Error ? err.message : String(err) });
  console.error(err);
  process.exit(1);
});
