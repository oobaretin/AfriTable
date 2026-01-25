import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export async function GET(request: Request) {
  const user = await requireAuth("/login?redirectTo=/favorites");
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") ?? "recent";

  const supabase = createSupabaseServerClient();
  const { data: favs, error } = await supabase
    .from("favorites")
    .select("restaurant_id,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });

  const ids = (favs ?? []).map((f: any) => f.restaurant_id);
  const { data: restaurants } = await supabase
    .from("restaurants_with_rating")
    .select("id,slug,name,cuisine_types,price_range,address,images,avg_rating,review_count,is_active,created_at")
    .in("id", ids);

  const map = new Map((restaurants ?? []).map((r: any) => [r.id, r]));
  let rows = (favs ?? [])
    .map((f: any) => ({ ...f, restaurant: map.get(f.restaurant_id) ?? null }))
    .filter((x: any) => x.restaurant && x.restaurant.is_active);

  if (sort === "alpha") rows = rows.sort((a: any, b: any) => a.restaurant.name.localeCompare(b.restaurant.name));
  if (sort === "rating")
    rows = rows.sort((a: any, b: any) => (b.restaurant.avg_rating ?? 0) - (a.restaurant.avg_rating ?? 0));

  return NextResponse.json({ favorites: rows });
}

