#!/usr/bin/env node
/**
 * Generate a verification report with Google Maps links for each restaurant.
 * Open the HTML file in a browser, click "Verify on Google Maps" to check each
 * listing on Google Maps (the website) and update data/restaurants.json manually.
 *
 * Run: node scripts/verify-via-google-maps.mjs
 * Output: data/restaurants-verify-report.html
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "restaurants.json");
const outPath = join(__dirname, "..", "data", "restaurants-verify-report.html");
const data = JSON.parse(readFileSync(dataPath, "utf8"));

const zipRe = /\d{5}(-\d{4})?/;

function googleMapsSearchUrl(name, address) {
  const query = [name, address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function needsVerification(r) {
  const noPhone = !r.phone || !String(r.phone).trim();
  const noWebsite = !r.website || !String(r.website).trim();
  const noZip = !r.address || !zipRe.test(r.address);
  return noPhone || noWebsite || noZip;
}

const all = data.map((r) => ({
  ...r,
  mapsUrl: googleMapsSearchUrl(r.name, r.address),
  needsVerification: needsVerification(r),
}));

const needsWork = all.filter((r) => r.needsVerification);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Restaurant data verification – Google Maps</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 1rem auto; padding: 0 1rem; }
    h1 { font-size: 1.25rem; }
    p { color: #444; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 0.75rem; padding: 0.5rem; border-radius: 6px; background: #f5f5f5; }
    li.needs { background: #fff8e6; }
    a.maps { display: inline-block; margin-top: 0.25rem; color: #1967d2; font-weight: 500; }
    a.maps:hover { text-decoration: underline; }
    .meta { font-size: 0.875rem; color: #666; }
    .badge { font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; background: #e0e0e0; margin-left: 0.25rem; }
    .badge.missing { background: #ffcdd2; }
  </style>
</head>
<body>
  <h1>Verify restaurant data via Google Maps</h1>
  <p>Click <strong>Verify on Google Maps</strong> to open each place on Google Maps. Compare address, phone, website, and hours with <code>data/restaurants.json</code> and update the JSON as needed.</p>
  <p><strong>${needsWork.length}</strong> of ${all.length} entries need verification (missing phone, website, or full address).</p>
  <ul>
    ${all
      .map(
        (r) => `
    <li class="${r.needsVerification ? "needs" : ""}">
      <strong>${escapeHtml(r.name)}</strong>
      ${r.needsVerification ? '<span class="badge missing">needs check</span>' : ""}
      <div class="meta">${escapeHtml(r.address || "—")} ${r.state ? ` · ${r.state}` : ""}</div>
      <a class="maps" href="${escapeHtml(r.mapsUrl)}" target="_blank" rel="noopener">Verify on Google Maps →</a>
    </li>`
      )
      .join("")}
  </ul>
</body>
</html>`;

function escapeHtml(s) {
  if (s == null) return "";
  const str = String(s);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

writeFileSync(outPath, html, "utf8");
console.log("Report written to:", outPath);
console.log("Open it in a browser and use the links to verify each restaurant on Google Maps.");
console.log("Entries that need verification (missing phone/website/full address) are highlighted.");
