#!/usr/bin/env node
/** Sync website URLs from data/restaurants.json → Supabase restaurants table. */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: path.join(process.cwd(), ".env.local") });

const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "restaurants.json"), "utf8"));
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let updated = 0;
for (const r of catalog) {
  if (!r.website) continue;
  const { error } = await supabase.from("restaurants").update({ website: r.website }).eq("slug", r.id);
  if (!error) updated++;
}
console.log(`Synced ${updated} website URLs to Supabase`);
