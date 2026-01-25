import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as crypto from "node:crypto";

interface RestaurantImport {
  name: string;
  cuisine_types: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: { lat: number; lng: number };
  };
  phone: string;
  website?: string;
  description: string;
  price_range: number;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  google_rating?: number;
  google_review_count?: number;
  instagram?: string;
  facebook?: string;
  images?: string[];
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

type OperatingHour = { day_of_week: number; open_time: string; close_time: string };

function normalizeHoursToArray(hours: RestaurantImport["hours"]): OperatingHour[] {
  // DB expects: day_of_week 0..6 (Sun..Sat)
  const map: Array<[string, number]> = [
    ["sunday", 0],
    ["monday", 1],
    ["tuesday", 2],
    ["wednesday", 3],
    ["thursday", 4],
    ["friday", 5],
    ["saturday", 6],
  ];

  const out: OperatingHour[] = [];
  for (const [k, dow] of map) {
    const v = hours?.[k] ?? hours?.[k.toUpperCase()] ?? hours?.[k[0].toUpperCase() + k.slice(1)];
    if (!v) continue;
    if (v.closed) continue;
    if (!v.open || !v.close) continue;
    out.push({ day_of_week: dow, open_time: String(v.open), close_time: String(v.close) });
  }
  return out;
}

async function findUserIdByEmail(supabase: SupabaseClient<any>, email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const listed = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const found = (listed.data?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found?.id) return found.id;
    if ((listed.data?.users ?? []).length < 200) break;
  }
  return null;
}

async function getOrCreateOwnerForSlug(
  supabase: SupabaseClient<any>,
  slug: string,
  restaurantName: string,
  phone: string,
) {
  const baseEmail = `${slug}@owners.afritable.com`.replace(/[^a-z0-9@._+-]/gi, "");

  for (let attempt = 0; attempt < 5; attempt++) {
    const email =
      attempt === 0 ? baseEmail : `${slug}-${crypto.randomBytes(2).toString("hex")}@owners.afritable.com`;
    const password = generatePassword();

    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${restaurantName} Owner`,
        role: "restaurant_owner",
        phone,
      },
    });

    if (!created.error && created.data?.user?.id) {
      return { ownerId: created.data.user.id, email, password };
    }

    if (created.error && /already/i.test(created.error.message)) {
      const existingId = await findUserIdByEmail(supabase, email);
      if (existingId) return { ownerId: existingId, email, password: null as string | null };
    }
  }

  throw new Error(`Could not create/find owner user for ${restaurantName}`);
}

async function importRestaurants(filePath: string) {
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }) as SupabaseClient<any>;

  const restaurants: RestaurantImport[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const results = {
    successful: [] as string[],
    failed: [] as { name: string; error: string }[],
  };

  for (const restaurant of restaurants) {
    try {
      const baseSlug = slugify(restaurant.name);
      let slug = `${baseSlug}-${slugify(restaurant.address.city)}`;

      const { data: existing } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
      if (existing) slug += `-${Date.now()}`;

      const { ownerId, email: ownerEmail, password } = await getOrCreateOwnerForSlug(
        supabase,
        slug,
        restaurant.name,
        restaurant.phone,
      );

      // Ensure profile is present (signup trigger usually creates it too)
      await supabase
        .from("profiles")
        .upsert(
          {
            id: ownerId,
            full_name: `${restaurant.name} Owner`,
            role: "restaurant_owner",
            phone: restaurant.phone,
          },
          { onConflict: "id" },
        )
        .throwOnError();

      const operatingHours = normalizeHoursToArray(restaurant.hours);

      const { data: restaurantRow, error } = await supabase
        .from("restaurants")
        .upsert(
          {
            owner_id: ownerId,
            name: restaurant.name,
            slug,
            cuisine_types: restaurant.cuisine_types,
            address: restaurant.address,
            phone: restaurant.phone,
            website: restaurant.website ?? null,
            instagram_handle: restaurant.instagram ?? null,
            facebook_url: restaurant.facebook ?? null,
            external_avg_rating: restaurant.google_rating ?? null,
            external_review_count: restaurant.google_review_count ?? null,
            description: restaurant.description,
            price_range: restaurant.price_range,
            hours: operatingHours,
            images: restaurant.images ?? [],
            is_active: false,
          },
          { onConflict: "slug" },
        )
        .select("id,slug")
        .single();

      if (error) throw error;

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

      fs.appendFileSync(
        "import-credentials.txt",
        `${restaurant.name}\nEmail: ${ownerEmail}\nPassword: ${password ?? "(existing user)"}\nSlug: ${slug}\n\n`,
      );

      results.successful.push(restaurant.name);
    } catch (err) {
      results.failed.push({
        name: restaurant?.name ?? "Unknown",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  fs.writeFileSync("import-results.json", JSON.stringify(results, null, 2));
  // eslint-disable-next-line no-console
  console.log("✅ Import complete");
}

const file = process.argv[2];
if (!file) {
  // eslint-disable-next-line no-console
  console.error("Usage: npm run import:json -- <file>");
  process.exit(1);
}

void importRestaurants(file);

