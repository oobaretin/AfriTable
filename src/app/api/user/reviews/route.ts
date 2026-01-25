import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export async function GET() {
  const user = await requireAuth("/login?redirectTo=/reviews");
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("id,restaurant_id,reservation_id,overall_rating,food_rating,service_rating,ambiance_rating,review_text,photos,recommended_dishes,would_recommend,restaurant_response,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });

  const restaurantIds = Array.from(new Set((data ?? []).map((r: any) => r.restaurant_id)));
  const { data: restaurants } = await supabase
    .from("restaurants_with_rating")
    .select("id,slug,name,images")
    .in("id", restaurantIds);
  const map = new Map((restaurants ?? []).map((r: any) => [r.id, r]));

  const reviews = (data ?? []).map((r: any) => ({ ...r, restaurant: map.get(r.restaurant_id) ?? null }));
  return NextResponse.json({ reviews });
}

