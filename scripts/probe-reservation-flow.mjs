/**
 * Reservation flow Tier-2 probe.
 *
 * Tests whether DB-backed restaurants can actually accept online reservations
 * by inspecting their availability data and running a dry-run RPC.
 *
 * Six probes:
 *   R1: Active DB restaurants count                   (sanity check)
 *   R2: Restaurants with an availability_settings row (must be > 0 for any bookings)
 *   R3: Restaurants with at least one restaurant_tables row
 *   R4: Restaurants with both AND a non-empty operating_hours array
 *   R5: For each R4 candidate, profile its operating_hours coverage (which days of week)
 *   R6: Dry-run create_reservation against the first viable candidate, then roll back
 *       (we don't actually keep the booking — use a transaction in a wrapper RPC, or
 *       just delete the inserted row immediately. The RPC isn't transactional from
 *       outside so we insert and delete.)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

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

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// R1: active DB restaurants
const { count: activeCount } = await admin
  .from("restaurants")
  .select("id", { count: "exact", head: true })
  .eq("is_active", true);
console.log(`R1 active DB restaurants: ${activeCount}`);

// R2: count with availability_settings
const { count: settingsCount } = await admin
  .from("availability_settings")
  .select("restaurant_id", { count: "exact", head: true });
console.log(`R2 restaurants with availability_settings: ${settingsCount}  (need >0 for ANY bookings)`);

// R3: count with at least one table
const { data: tablesByRestaurant } = await admin
  .from("restaurant_tables")
  .select("restaurant_id")
  .eq("is_active", true);
const restaurantsWithTables = new Set((tablesByRestaurant ?? []).map((r) => r.restaurant_id));
console.log(`R3 restaurants with ≥1 active table:      ${restaurantsWithTables.size}`);

// R4: restaurants with availability_settings AND operating_hours non-empty AND ≥1 table
const { data: settingsRows } = await admin
  .from("availability_settings")
  .select("restaurant_id, operating_hours, slot_duration_minutes, max_party_size, advance_booking_days, same_day_cutoff_hours");
const viable = (settingsRows ?? []).filter((s) => {
  const ops = Array.isArray(s.operating_hours) ? s.operating_hours : [];
  return ops.length > 0 && restaurantsWithTables.has(s.restaurant_id);
});
console.log(`R4 restaurants viable for online booking: ${viable.length}  (have settings + tables + operating_hours)`);

// R5: operating_hours coverage profile for first 3 viable candidates
for (const v of viable.slice(0, 3)) {
  const dows = (v.operating_hours ?? []).map((o) => o.day_of_week);
  console.log(`R5 candidate ${v.restaurant_id} dow=${JSON.stringify(dows)} slot=${v.slot_duration_minutes}m maxParty=${v.max_party_size}`);
}

// R6: dry-run create_reservation against first viable candidate, then delete the row
if (viable.length === 0) {
  console.log(`R6 SKIP: no viable candidate for RPC dry-run.`);
} else {
  const candidate = viable[0];
  const ops = candidate.operating_hours;
  // Pick a date this week that has operating_hours coverage, and a time inside its window.
  const today = new Date();
  let target = null;
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    const op = ops.find((x) => Number(x.day_of_week) === dow);
    if (op?.open_time && op?.close_time) {
      target = { date: d.toISOString().slice(0, 10), open: op.open_time, close: op.close_time };
      break;
    }
  }
  if (!target) {
    console.log(`R6 SKIP: candidate has operating_hours but none in the next 14 days.`);
  } else {
    // Pick a time 1 hour after open, format HH:MM
    const [h, m] = String(target.open).split(":").map(Number);
    const startMin = (h * 60 + m) + 60;
    const tt = `${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}`;
    const { data: rpc, error: rpcErr } = await admin.rpc("create_reservation", {
      p_restaurant_id: candidate.restaurant_id,
      p_reservation_date: target.date,
      p_reservation_time: tt,
      p_party_size: 2,
      p_guest_name: "Probe Diner",
      p_guest_email: "probe@afritable.com",
      p_guest_phone: "+15555550100",
      p_special_requests: "internal probe — safe to ignore",
      p_occasion: null,
      p_user_id: null,
    });
    if (rpcErr) {
      console.log(`R6 RPC error: code=${rpcErr.code} msg=${rpcErr.message}`);
    } else {
      console.log(`R6 RPC SUCCESS: reservation ${rpc.id} status=${rpc.status}`);
      // Delete the probe reservation (admin client bypasses RLS)
      const { error: delErr } = await admin.from("reservations").delete().eq("id", rpc.id);
      if (delErr) {
        console.log(`R6 cleanup FAILED: ${delErr.message} — reservation ${rpc.id} still in DB`);
      } else {
        console.log(`R6 cleanup OK: reservation ${rpc.id} deleted`);
      }
    }
  }
}

console.log("\nProbe complete.");
