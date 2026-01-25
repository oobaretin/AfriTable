import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRestaurantOwner } from "@/lib/dashboard/auth";

const querySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
  from: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
  to: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
  status: z.enum(["all", "pending", "confirmed", "seated", "completed", "cancelled", "no_show"]).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    restaurantId: url.searchParams.get("restaurantId") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid_query" }, { status: 400 });

  const day = parsed.data.date ?? format(new Date(), "yyyy-MM-dd");
  const from = parsed.data.from ?? day;
  const to = parsed.data.to ?? day;

  const { restaurantId } = await requireRestaurantOwner(parsed.data.restaurantId);
  const supabase = createSupabaseServerClient();

  let q = supabase
    .from("reservations")
    .select(
      "id,reservation_date,reservation_time,party_size,status,guest_name,guest_email,guest_phone,special_requests,occasion,internal_note,assigned_table_id,created_at,updated_at,user_id",
    )
    .eq("restaurant_id", restaurantId)
    .gte("reservation_date", from)
    .lte("reservation_date", to)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  const status = parsed.data.status;
  if (status && status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });

  const rows = data ?? [];

  // Stats for the day (if a single date)
  const dayRows = rows.filter((r: any) => r.reservation_date === day);
  const total = dayRows.length;
  const completed = dayRows.filter((r: any) => r.status === "completed").length;
  const noShows = dayRows.filter((r: any) => r.status === "no_show").length;
  const upcoming = dayRows.filter((r: any) => ["pending", "confirmed"].includes(r.status)).length;
  const covers = dayRows.reduce((sum: number, r: any) => sum + (r.party_size ?? 0), 0);

  return NextResponse.json({
    restaurantId,
    day,
    stats: { total, completed, noShows, upcoming, covers },
    reservations: rows,
  });
}

