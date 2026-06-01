#!/usr/bin/env node
/**
 * Activate restaurants imported from SerpAPI (sources.serpapi = true).
 * Leaves other inactive rows (manual drafts) unchanged.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const { data: inactive, error: fetchErr } = await supabase
    .from("restaurants")
    .select("id,slug,name,sources,is_active")
    .eq("is_active", false);

  if (fetchErr) throw fetchErr;

  const targets = (inactive ?? []).filter((r) => r.sources?.serpapi === true);

  if (targets.length === 0) {
    console.log("No SerpAPI imports to activate.");
    return;
  }

  if (dryRun) {
    console.log(`Dry-run: would activate ${targets.length} restaurants`);
    targets.slice(0, 10).forEach((r) => console.log(`  - ${r.name} (${r.slug})`));
    return;
  }

  const ids = targets.map((r) => r.id);
  const { error: updateErr } = await supabase.from("restaurants").update({ is_active: true }).in("id", ids);
  if (updateErr) throw updateErr;

  const { count: activeCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: inactiveCount } = await supabase
    .from("restaurants")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  console.log(`Activated ${targets.length} SerpAPI restaurants`);
  console.log(`DB now: ${activeCount} active, ${inactiveCount} inactive`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
