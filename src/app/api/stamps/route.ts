import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // Fetch recent stamps with restaurant and user info
  const { data: stamps, error } = await supabase
    .from("stamps" as any)
    .select(
      `
      id,
      photo_url,
      review_text,
      created_at,
      restaurant:restaurants(id, name, slug, cuisine_types, address, avg_rating),
      user:profiles(id, full_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching stamps:", error);
    return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  }

  // Transform data for frontend
  const transformed = (stamps || []).map((stamp: any) => ({
    id: stamp.id,
    photoUrl: stamp.photo_url,
    reviewText: stamp.review_text,
    createdAt: stamp.created_at,
    restaurant: stamp.restaurant
      ? {
          name: stamp.restaurant.name,
          slug: stamp.restaurant.slug,
          cuisine: Array.isArray(stamp.restaurant.cuisine_types)
            ? stamp.restaurant.cuisine_types[0]
            : null,
          city: stamp.restaurant.address ? extractCity(stamp.restaurant.address) : null,
          rating: stamp.restaurant.avg_rating,
        }
      : null,
    userName: stamp.user?.full_name || "Anonymous",
    userAvatar: stamp.user?.avatar_url || null,
  }));

  return NextResponse.json({ stamps: transformed });
}

function extractCity(address: any): string {
  if (!address) return "";
  if (typeof address === "string") {
    const parts = address.split(",");
    return parts.length > 0 ? parts[parts.length - 2]?.trim() || "" : "";
  }
  if (typeof address === "object" && address !== null) {
    return (address as any).city || "";
  }
  return "";
}
