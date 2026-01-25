import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, requireRestaurantOwner } from "@/lib/dashboard/auth";

const patchSchema = z.object({
  operating_hours: z.any().optional(),
  slot_duration_minutes: z.number().int().min(30).max(240).optional(),
  advance_booking_days: z.number().int().min(0).max(90).optional(),
  same_day_cutoff_hours: z.number().int().min(0).max(24).optional(),
  max_party_size: z.number().int().min(1).max(100).optional(),
  online_reservations_enabled: z.boolean().optional(),
  buffer_minutes: z.number().int().min(0).max(120).optional(),
});

export async function PATCH(request: Request) {
  assertSameOrigin();
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const owner = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("availability_settings")
    .upsert({ restaurant_id: owner.restaurantId, ...parsed.data }, { onConflict: "restaurant_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "update_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const restaurantId = url.searchParams.get("restaurantId");
  const owner = await requireRestaurantOwner(restaurantId);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("availability_settings")
    .select("*")
    .eq("restaurant_id", owner.restaurantId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  return NextResponse.json({ restaurantId: owner.restaurantId, settings: data });
}

