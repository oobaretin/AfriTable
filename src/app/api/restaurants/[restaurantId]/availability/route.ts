import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { OperatingHour } from "@/lib/reservation/availability";
import { calculateAvailableTimeSlots } from "@/lib/reservation/availability";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.string().optional().default("2"),
});

const DEFAULT_OPERATING_HOURS: OperatingHour[] = [
  { day_of_week: 1, open_time: "10:00", close_time: "22:00" },
  { day_of_week: 2, open_time: "10:00", close_time: "22:00" },
  { day_of_week: 3, open_time: "10:00", close_time: "22:00" },
  { day_of_week: 4, open_time: "10:00", close_time: "22:00" },
  { day_of_week: 5, open_time: "10:00", close_time: "23:00" },
  { day_of_week: 6, open_time: "12:00", close_time: "23:00" },
  { day_of_week: 0, open_time: "12:00", close_time: "21:00" },
];

function normalizeOperatingHours(input: unknown): OperatingHour[] {
  // If it's already an array format, process it directly
  if (Array.isArray(input)) {
    return input
      .map((o: any) => ({
        day_of_week: Number(o?.day_of_week),
        open_time: String(o?.open_time ?? ""),
        close_time: String(o?.close_time ?? ""),
      }))
      .filter(
        (o) =>
          Number.isFinite(o.day_of_week) &&
          o.day_of_week >= 0 &&
          o.day_of_week <= 6 &&
          /^\d{2}:\d{2}$/.test(o.open_time) &&
          /^\d{2}:\d{2}$/.test(o.close_time),
      );
  }

  // If it's an object format (e.g., {monday: {open: "10:00", close: "22:00"}}), convert it
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const hoursObj = input as Record<string, any>;
    const dayMap: Array<[string, number]> = [
      ["sunday", 0],
      ["monday", 1],
      ["tuesday", 2],
      ["wednesday", 3],
      ["thursday", 4],
      ["friday", 5],
      ["saturday", 6],
    ];

    const result: OperatingHour[] = [];
    for (const [dayName, dayOfWeek] of dayMap) {
      const dayData = hoursObj[dayName] ?? hoursObj[dayName.toLowerCase()] ?? hoursObj[dayName[0].toUpperCase() + dayName.slice(1)];
      if (!dayData || dayData.closed) continue;

      // Handle different time formats
      let openTime = dayData.open || dayData.open_time || "";
      let closeTime = dayData.close || dayData.close_time || "";

      // Convert to HH:mm format if needed
      if (openTime && !/^\d{2}:\d{2}$/.test(openTime)) {
        // Try to parse various formats
        const match = openTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2] || "0", 10);
          const period = match[3]?.toLowerCase();
          if (period === "pm" && h !== 12) h += 12;
          if (period === "am" && h === 12) h = 0;
          openTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }
      if (closeTime && !/^\d{2}:\d{2}$/.test(closeTime)) {
        const match = closeTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2] || "0", 10);
          const period = match[3]?.toLowerCase();
          if (period === "pm" && h !== 12) h += 12;
          if (period === "am" && h === 12) h = 0;
          closeTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }

      if (/^\d{2}:\d{2}$/.test(openTime) && /^\d{2}:\d{2}$/.test(closeTime)) {
        result.push({
          day_of_week: dayOfWeek,
          open_time: openTime,
          close_time: closeTime,
        });
      }
    }
    return result;
  }

  return [];
}

function pickOperatingHours(...candidates: OperatingHour[][]): OperatingHour[] {
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
  }
  return DEFAULT_OPERATING_HOURS;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  context: { params: Promise<{ restaurantId: string }> | { restaurantId: string } },
) {
  const params = context.params as Promise<{ restaurantId: string }> | { restaurantId: string };
  const restaurantIdParam = typeof (params as Promise<{ restaurantId: string }>).then === "function"
    ? (await (params as Promise<{ restaurantId: string }>)).restaurantId
    : (params as { restaurantId: string }).restaurantId;

  const url = new URL(request.url);

  const parsed = querySchema.safeParse({
    date: url.searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd"),
    partySize: url.searchParams.get("partySize") ?? "2",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const dateStr = parsed.data.date;
  const partySize = parsed.data.partySize === "20+" ? 20 : Number(parsed.data.partySize);
  if (!Number.isFinite(partySize) || partySize <= 0) {
    return NextResponse.json({ error: "invalid_party_size" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    // Resolve slug to id when param looks like a slug (e.g. "apt4b-atlanta").
    let restaurantId = restaurantIdParam;
    if (!UUID_REGEX.test(restaurantIdParam)) {
      const { data: bySlug } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", restaurantIdParam)
        .maybeSingle();
      if (bySlug?.id) restaurantId = bySlug.id;
    }

    // Ensure restaurant exists and is active (avoid leaking inactive restaurants).
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id,is_active,hours")
      .eq("id", restaurantId)
      .maybeSingle();

    if (restaurantError) {
      console.error("[availability] restaurant lookup error:", restaurantError);
      return NextResponse.json({ error: "restaurant_lookup_failed" }, { status: 500 });
    }
        if (!restaurant || !restaurant.is_active) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const [{ data: settings }, { data: tables }, { data: reservations }] = await Promise.all([
      supabase
        .from("availability_settings")
        .select("slot_duration_minutes,operating_hours")
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
      supabase
        .from("restaurant_tables")
        .select("capacity,is_active")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true),
      supabase
        .from("reservations")
        .select("reservation_time,status")
        .eq("restaurant_id", restaurantId)
        .eq("reservation_date", dateStr)
        .in("status", ["pending", "confirmed", "seated"]),
    ]);

    const slotDurationMinutes = settings?.slot_duration_minutes ?? 90;
    const operatingHours = pickOperatingHours(
      normalizeOperatingHours(settings?.operating_hours),
      normalizeOperatingHours((restaurant as any)?.hours),
    );

    const eligibleTableCount =
      (tables ?? []).filter((t: any) => (t?.capacity ?? 0) >= partySize && t?.is_active !== false).length;

    // Map reservation counts by exact HH:mm (best-effort; no table assignment in schema).
    const reservationCountsByTime: Record<string, number> = {};
    for (const r of reservations ?? []) {
      const time = String((r as any).reservation_time).slice(0, 5);
      reservationCountsByTime[time] = (reservationCountsByTime[time] ?? 0) + 1;
    }

    const slots = calculateAvailableTimeSlots({
      date: new Date(dateStr + "T00:00:00"),
      operatingHours,
      slotDurationMinutes,
      eligibleTableCount,
      reservationCountsByTime,
    });

    return NextResponse.json({
      date: dateStr,
      partySize,
      slotDurationMinutes,
      eligibleTableCount,
      slots,
    });
  } catch (err) {
    console.error("[availability] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "availability_failed" },
      { status: 500 },
    );
  }
}

