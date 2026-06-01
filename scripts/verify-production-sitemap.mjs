#!/usr/bin/env node
/**
 * Compare production sitemap URL count vs expected (local Supabase probe).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROD_BASE = "https://afri-table.com";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const t = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of t.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {}
  return env;
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { count: dbActive } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const res = await fetch(`${PROD_BASE}/sitemap.xml`, {
    headers: { "Cache-Control": "no-cache" },
  });
  const xml = await res.text();
  const totalUrls = (xml.match(/<url>/g) || []).length;
  const restaurantUrls = (xml.match(/\/restaurants\//g) || []).length;
  const cache = res.headers.get("x-vercel-cache");
  const age = res.headers.get("age");

  const verdict =
    totalUrls >= 500 && restaurantUrls >= dbActive - 20 ? "PASS" : "FAIL";

  console.log("Production sitemap verification");
  console.log(`  DB active restaurants: ${dbActive}`);
  console.log(`  sitemap.xml <url> count:  ${totalUrls}`);
  console.log(`  /restaurants/ mentions:  ${restaurantUrls}`);
  console.log(`  x-vercel-cache:          ${cache}`);
  console.log(`  age (seconds):           ${age}`);
  console.log(`  Verdict:                 ${verdict}`);
  if (verdict === "FAIL") {
    console.log("\nDeploy latest main (sitemap force-dynamic) and re-run this script.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
