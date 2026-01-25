#!/usr/bin/env node
import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Load `.env*` files (including `.env.local`) like Next.js does.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
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

function generatePassword() {
  // Avoid confusing chars (0/O, 1/l/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function normalizeHoursToArray(hoursObj) {
  // DB expects: [{ day_of_week: 0..6 (Sun..Sat), open_time: "HH:mm", close_time: "HH:mm" }]
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

async function findUserIdByEmail(supabaseAdmin, email) {
  for (let page = 1; page <= 20; page++) {
    const listed = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    const found = (listed.data?.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found?.id) return found.id;
    if ((listed.data?.users || []).length < 200) break;
  }
  return null;
}

async function getOrCreateOwnerForSlug(supabaseAdmin, slug, restaurantName, phone) {
  // Deterministic base email per slug; add suffix if collision.
  const baseEmail = `${slug}@owners.afritable.com`.replace(/[^a-z0-9@._+-]/gi, "");

  for (let attempt = 0; attempt < 5; attempt++) {
    const email = attempt === 0 ? baseEmail : `${slug}-${crypto.randomBytes(2).toString("hex")}@owners.afritable.com`;
    const password = generatePassword();

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${restaurantName} Owner`,
        role: "restaurant_owner",
        phone: phone || null,
      },
    });

    if (!created.error && created.data?.user?.id) {
      return { ownerId: created.data.user.id, email, password };
    }

    // If email exists already, reuse it (idempotent re-runs).
    if (created.error && /already/i.test(created.error.message)) {
      const existingId = await findUserIdByEmail(supabaseAdmin, email);
      if (existingId) return { ownerId: existingId, email, password: null };
    }
  }

  throw new Error(`Could not create/find owner user for ${restaurantName}`);
}

async function importRestaurants(filePath) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const abs = path.resolve(process.cwd(), filePath);
  const restaurants = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(restaurants)) throw new Error("Input file must be a JSON array.");

  const results = { successful: [], failed: [] };

  for (const restaurant of restaurants) {
    const name = restaurant?.name;
    try {
      if (!name) throw new Error("Missing restaurant.name");
      const city = restaurant?.address?.city || "city";
      const baseSlug = slugify(name);
      let slug = `${baseSlug}-${slugify(city)}`;

      // Ensure slug is unique enough.
      const { data: existing } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
      if (existing) slug = `${slug}-${Date.now()}`;

      const { ownerId, email, password } = await getOrCreateOwnerForSlug(
        supabase,
        slug,
        name,
        restaurant?.phone || null,
      );

      // Upsert profile fields (trigger also creates profiles on auth user creation).
      await supabase
        .from("profiles")
        .upsert(
          {
            id: ownerId,
            full_name: `${name} Owner`,
            role: "restaurant_owner",
            phone: restaurant?.phone || null,
          },
          { onConflict: "id" },
        )
        .throwOnError();

      const operatingHours = normalizeHoursToArray(restaurant?.hours);

      const { data: restaurantRow, error } = await supabase
        .from("restaurants")
        .upsert(
          {
            owner_id: ownerId,
            name,
            slug,
            cuisine_types: Array.isArray(restaurant?.cuisine_types) ? restaurant.cuisine_types : [],
            address: restaurant?.address ?? null,
            phone: normalizeOptionalString(restaurant?.phone),
            website: normalizeOptionalString(restaurant?.website),
            instagram_handle: normalizeOptionalString(restaurant?.instagram),
            facebook_url: normalizeOptionalString(restaurant?.facebook),
            external_avg_rating: typeof restaurant?.google_rating === "number" ? restaurant.google_rating : null,
            external_review_count: typeof restaurant?.google_review_count === "number" ? restaurant.google_review_count : null,
            sources: restaurant?.sources && typeof restaurant.sources === "object" ? restaurant.sources : {},
            description: restaurant?.description ?? null,
            price_range: Number(restaurant?.price_range || 2),
            hours: operatingHours,
            images: Array.isArray(restaurant?.images) ? restaurant.images : [],
            is_active: false, // safer default for bulk imports
          },
          { onConflict: "slug" },
        )
        .select("id,slug")
        .single();

      if (error) throw error;

      // Seed tables (replace existing to be idempotent)
      const tables = [
        { table_number: "T1", capacity: 2 },
        { table_number: "T2", capacity: 2 },
        { table_number: "T3", capacity: 4 },
        { table_number: "T4", capacity: 4 },
        { table_number: "T5", capacity: 4 },
        { table_number: "T6", capacity: 6 },
        { table_number: "T7", capacity: 6 },
      ];
      await supabase.from("restaurant_tables").delete().eq("restaurant_id", restaurantRow.id);
      await supabase
        .from("restaurant_tables")
        .insert(tables.map((t) => ({ restaurant_id: restaurantRow.id, ...t, is_active: true })))
        .throwOnError();

      // Upsert availability settings
      await supabase
        .from("availability_settings")
        .upsert(
          {
            restaurant_id: restaurantRow.id,
            slot_duration_minutes: 90,
            advance_booking_days: 30,
            same_day_cutoff_hours: 2,
            max_party_size: 20,
            operating_hours: operatingHours,
          },
          { onConflict: "restaurant_id" },
        )
        .throwOnError();

      // Write credentials (gitignored)
      fs.appendFileSync(
        "import-credentials.txt",
        `${name}\nEmail: ${email}\nPassword: ${password ?? "(existing user)"}\nSlug: ${slug}\n\n`,
      );

      results.successful.push(name);
    } catch (err) {
      results.failed.push({
        name: name || "unknown",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  fs.writeFileSync("import-results.json", JSON.stringify(results, null, 2));
  // eslint-disable-next-line no-console
  console.log(`✅ Import complete: ${results.successful.length} ok, ${results.failed.length} failed`);
}

const file = process.argv[2];
if (!file) {
  // eslint-disable-next-line no-console
  console.error("Usage: npm run import:json -- <file>");
  process.exit(1);
}

importRestaurants(file).catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

