import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export async function GET() {
  const user = await requireAuth("/login?redirectTo=/reservations");
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("id,restaurant_id,reservation_date,reservation_time,party_size,status,special_requests,occasion,created_at,updated_at")
    .eq("user_id", user.id)
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });

  const restaurantIds = Array.from(new Set((data ?? []).map((r: any) => r.restaurant_id)));
  const { data: restaurants } = await supabase
    .from("restaurants_with_rating")
    .select("id,slug,name,address,phone,images,cuisine_types,avg_rating,review_count")
    .in("id", restaurantIds);

  const restaurantById = new Map((restaurants ?? []).map((r: any) => [r.id, r]));

  const reservations = (data ?? []).map((r: any) => ({
    ...r,
    restaurant: restaurantById.get(r.restaurant_id) ?? null,
  }));

  return NextResponse.json({ reservations });
}

