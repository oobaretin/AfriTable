#!/usr/bin/env tsx
/** Remove catalog websites whose domain does not match the restaurant name. */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { hostMatchesRestaurantName, isBlockedWebsiteUrl } from "../src/lib/discover-restaurant-website";
import { resolveGoogleSearchUrl } from "../src/lib/google-search-url";

config({ path: path.join(process.cwd(), ".env.local") });

const CATALOG = path.join(process.cwd(), "data", "restaurants.json");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8")) as any[];
  const cleared: string[] = [];

  for (const r of catalog) {
    const w = String(r.website || "").trim();
    if (!w) continue;
    let bad = isBlockedWebsiteUrl(w);
    if (!bad) {
      try {
        const host = new URL(w.startsWith("http") ? w : `https://${w}`).hostname;
        bad = !hostMatchesRestaurantName(host, r.name);
      } catch {
        bad = true;
      }
    }
    if (bad) {
      cleared.push(r.id);
      r.website = undefined;
      r.google_search_url = resolveGoogleSearchUrl(r);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2));
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    for (const slug of cleared) {
      await supabase.from("restaurants").update({ website: null }).eq("slug", slug);
    }
  }

  console.log(`Cleared ${cleared.length} invalid websites`);
  cleared.slice(0, 20).forEach((s) => console.log(`  - ${s}`));
  if (dryRun) console.log("DRY RUN");
}

main();
