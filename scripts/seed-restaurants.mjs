#!/usr/bin/env node
import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Load `.env*` files (including `.env.local`) like Next.js does.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function parseMissingColumnError(message) {
  // PostgREST: "Could not find the 'external_avg_rating' column of 'restaurants' in the schema cache"
  const m = String(message || "").match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/i);
  if (!m) return null;
  return { column: m[1], table: m[2] };
}

async function upsertWithColumnFallback(params) {
  const { supabaseAdmin, table, payload, onConflict, select, single } = params;
  const cleaned = { ...payload };

  // Retry by stripping unknown fields until PostgREST accepts the payload.
  // This lets seeding work even when the project's DB schema is behind.
  for (let attempt = 0; attempt < 20; attempt++) {
    let q = supabaseAdmin.from(table).upsert(cleaned, { onConflict });
    if (select) q = q.select(select);
    if (single) q = q.single();

    // eslint-disable-next-line no-await-in-loop
    const res = await q;
    if (!res.error) return res;

    const miss = parseMissingColumnError(res.error.message);
    if (miss && miss.table === table && Object.prototype.hasOwnProperty.call(cleaned, miss.column)) {
      // eslint-disable-next-line no-console
      console.warn(`seed: ${table}: dropping missing column '${miss.column}' and retrying`);
      delete cleaned[miss.column];
      continue;
    }

    // No known fallback, propagate.
    throw res.error;
  }

  throw new Error(`seed: ${table}: too many retries while stripping missing columns`);
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toHHmm(input) {
  const s = String(input || "").trim();
  if (!s) return null;
  if (/^\d{2}:\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;

  const rawH = Number(m[1]);
  const rawM = Number(m[2] ?? "0");
  const ampm = String(m[3]).toUpperCase();
  if (!Number.isFinite(rawH) || rawH < 1 || rawH > 12) return null;
  if (!Number.isFinite(rawM) || rawM < 0 || rawM > 59) return null;

  let hh = rawH % 12;
  if (ampm === "PM") hh += 12;
  return `${String(hh).padStart(2, "0")}:${String(rawM).padStart(2, "0")}`;
}

function normalizeOptionalString(v) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

function normalizeHoursToArray(hoursObj) {
  // Our DB uses: [{ day_of_week: 0..6, open_time: "HH:mm", close_time: "HH:mm" }]
  // Input uses: { monday: { open, close, closed }, ... }
  if (!hoursObj || typeof hoursObj !== "object") return [];
  const map = [
    ["sunday", 0],
    ["monday", 1],
    ["tuesday", 2],
    ["wednesday", 3],
    ["thursday", 4],
    ["friday", 5],
    ["saturday", 6],
  ];
  const out = [];
  for (const [key, dow] of map) {
    const v = hoursObj[key];
    if (!v || typeof v !== "object") continue;
    if (v.closed) continue;
    const open = toHHmm(v.open);
    const close = toHHmm(v.close);
    if (!open || !close) continue;
    out.push({ day_of_week: dow, open_time: open, close_time: close });
  }
  return out;
}

async function getOrCreateSeedOwner(supabaseAdmin) {
  const email = process.env.SEED_OWNER_EMAIL || "seed-owner@afritable.local";
  const password =
    process.env.SEED_OWNER_PASSWORD || crypto.randomBytes(24).toString("base64url") + "Aa1!";

  // Try to create; if exists, look it up.
  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "AfriTable Seed Owner",
      role: "restaurant_owner",
      phone: "(000) 000-0000",
    },
  });

  if (!created.error && created.data?.user?.id) {
    // eslint-disable-next-line no-console
    console.log(`seed owner created: ${email}`);
    return created.data.user.id;
  }

  // If user already exists, find by email (best-effort).
  if (created.error && /already/i.test(created.error.message)) {
    for (let page = 1; page <= 10; page++) {
      const listed = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      const found = (listed.data?.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found?.id) {
        // eslint-disable-next-line no-console
        console.log(`seed owner found: ${email}`);
        return found.id;
      }
      if ((listed.data?.users || []).length < 200) break;
    }
  }

  throw new Error(`Could not create/find seed owner (${email}): ${created.error?.message || "unknown error"}`);
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const ownerId = await getOrCreateSeedOwner(supabaseAdmin);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const seedArg = process.argv[2];
  const seedPath = seedArg
    ? path.resolve(process.cwd(), seedArg)
    : path.resolve(__dirname, "..", "data", "seed", "restaurants.json");
  const raw = fs.readFileSync(seedPath, "utf8");
  const records = JSON.parse(raw);
  if (!Array.isArray(records) || records.length === 0) throw new Error("No restaurants found in data/seed/restaurants.json");

  for (const r of records) {
    const name = r.name;
    const slug = slugify(r.slug || r.name);
    const cuisineTypes = Array.isArray(r.cuisine_types) ? r.cuisine_types : [];
    const address = r.address ?? null;
    const phone = normalizeOptionalString(r.phone);
    const website = normalizeOptionalString(r.website);
    const instagramHandle = normalizeOptionalString(r.instagram);
    const facebookUrl = normalizeOptionalString(r.facebook);
    const externalAvgRating = typeof r.google_rating === "number" ? r.google_rating : null;
    const sources = r.sources && typeof r.sources === "object" ? r.sources : {};

    const hoursArray = normalizeHoursToArray(r.hours);

    const images = [
      // safe placeholder (you can replace with real photos later)
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80",
    ];

    let restaurantId;
    try {
      const upsertRestaurant = await upsertWithColumnFallback({
        supabaseAdmin,
        table: "restaurants",
        payload: {
          owner_id: ownerId,
          name,
          slug,
          cuisine_types: cuisineTypes,
          address,
          phone,
          website,
          instagram_handle: instagramHandle,
          facebook_url: facebookUrl,
          external_avg_rating: externalAvgRating,
          external_review_count: r.google_review_count ?? null,
          sources,
          price_range: Number(r.price_range || 2),
          description: r.description ?? null,
          images,
          hours: hoursArray,
          is_active: true,
        },
        onConflict: "slug",
        select: "id,slug",
        single: true,
      });

      restaurantId = upsertRestaurant.data.id;
    } catch (e) {
      throw new Error(`Restaurant upsert failed (${name}): ${e?.message || String(e)}`);
    }

    // Availability settings (idempotent)
    try {
      await upsertWithColumnFallback({
        supabaseAdmin,
        table: "availability_settings",
        payload: {
          restaurant_id: restaurantId,
          slot_duration_minutes: 90,
          operating_hours: hoursArray,
        },
        onConflict: "restaurant_id",
      });
    } catch (e) {
      throw new Error(`availability_settings upsert failed (${name}): ${e?.message || String(e)}`);
    }

    // Seed a few tables so availability works immediately (idempotent via delete+insert)
    await supabaseAdmin.from("restaurant_tables").delete().eq("restaurant_id", restaurantId);
    const tables = [
      { table_number: "T1", capacity: 2 },
      { table_number: "T2", capacity: 2 },
      { table_number: "T3", capacity: 4 },
      { table_number: "T4", capacity: 4 },
      { table_number: "T5", capacity: 4 },
      { table_number: "T6", capacity: 6 },
      { table_number: "T7", capacity: 6 },
      { table_number: "T8", capacity: 8 },
    ].map((t) => ({ ...t, restaurant_id: restaurantId, is_active: true }));
    const insTables = await supabaseAdmin.from("restaurant_tables").insert(tables);
    if (insTables.error) throw new Error(`restaurant_tables insert failed (${name}): ${insTables.error.message}`);

    // eslint-disable-next-line no-console
    console.log(`seeded: ${name} (${slug})`);
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

