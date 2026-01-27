import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRestaurantOwner } from "@/lib/dashboard/auth";

export async function GET(request: Request) {
  const { restaurantId } = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();

  // Fetch reviews for the owner's restaurant
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, user_id, overall_rating, review_text, restaurant_response, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  }

  // Fetch user names for all reviews
  const userIds = Array.from(new Set((reviews ?? []).map((r: any) => r.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const userMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  // Transform to include user data
  const transformed = (reviews ?? []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    overall_rating: r.overall_rating,
    review_text: r.review_text,
    restaurant_response: r.restaurant_response,
    created_at: r.created_at,
    user: userMap.get(r.user_id) ? { full_name: userMap.get(r.user_id)?.full_name } : null,
  }));

  return NextResponse.json({ reviews: transformed });
}
