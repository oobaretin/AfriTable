#!/usr/bin/env node
/**
 * Apply metro copy enrichments (Houston / NYC / ATL) and phone lookups.
 *
 * Run: node scripts/apply-metro-enrichments.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "restaurants.json");
const enrichmentsPath = join(__dirname, "..", "data", "catalog-metro-copy-enrichments.json");
const logPath = join(__dirname, "..", ".cursor", "debug-3435b4.log");
const sessionId = "3435b4";

const dryRun = process.argv.includes("--dry-run");

function auditLog(message, data, hypothesisId = "enrich") {
  const line = JSON.stringify({
    sessionId,
    runId: dryRun ? "dry-run" : "apply",
    hypothesisId,
    location: "apply-metro-enrichments.mjs",
    message,
    data,
    timestamp: Date.now(),
  });
  try {
    appendFileSync(logPath, line + "\n");
  } catch {
    // ignore missing log dir
  }
}

const REMOVE_IDS = new Set([
  "guinea-conakry-austin", // Stale listing — 318 E 5th now occupied by another tenant
  "african-cuisine-san-diego", // Incomplete Cantina Wy address; unverified ghost listing
]);

const PHONE_UPDATES = {
  "ethiopian-famous-tempe": {
    phone: "(602) 449-0055",
    website: "https://ethiopianfamousrestaurant.com",
  },
  "island-breeze-san-bernardino": {
    phone: "(909) 352-2001",
    website: "https://www.ibjamaicancuisine.com",
  },
  "oga-suya-clt-charlotte": {
    phone: "(980) 467-4461",
  },
};

const STATE_FIXES = {
  "kofoshi-houston": "TX",
};

const TEMPLATED_ABOUT_RE =
  /^Authentic .+ restaurant in .+\. Experience traditional .+ flavors and hospitality at/i;

function main() {
  const catalog = JSON.parse(readFileSync(dataPath, "utf8"));
  const enrichments = JSON.parse(readFileSync(enrichmentsPath, "utf8"));

  const stats = {
    copyUpdated: 0,
    phonesUpdated: 0,
    removed: 0,
    stateFixed: 0,
    templatedRemaining: 0,
    missingPhoneRemaining: 0,
  };

  const kept = [];

  for (const r of catalog) {
    if (REMOVE_IDS.has(r.id)) {
      stats.removed++;
      auditLog("removed listing", { id: r.id, name: r.name }, "phone-cleanup");
      continue;
    }

    const copy = enrichments[r.id];
    if (copy) {
      Object.assign(r, copy);
      stats.copyUpdated++;
      auditLog("copy enriched", { id: r.id, name: r.name }, "copy-enrich");
    }

    const phonePatch = PHONE_UPDATES[r.id];
    if (phonePatch) {
      Object.assign(r, phonePatch);
      stats.phonesUpdated++;
      auditLog("phone updated", { id: r.id, phone: phonePatch.phone }, "phone-lookup");
    }

    if (STATE_FIXES[r.id]) {
      r.state = STATE_FIXES[r.id];
      stats.stateFixed++;
    }

    kept.push(r);
  }

  for (const r of kept) {
    if (TEMPLATED_ABOUT_RE.test(String(r.about || "").trim())) stats.templatedRemaining++;
    if (!String(r.phone || "").trim()) stats.missingPhoneRemaining++;
  }

  auditLog("apply complete", stats, "summary");

  if (!dryRun) {
    writeFileSync(dataPath, JSON.stringify(kept, null, 2) + "\n");
  }

  console.log(dryRun ? "DRY RUN — no files written\n" : "Applied enrichments\n");
  console.log(JSON.stringify(stats, null, 2));
}

main();
