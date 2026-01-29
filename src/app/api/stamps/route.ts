import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering since we use cookies for Supabase auth
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Fetch recent stamps with restaurant and user info
    // Use left join to handle cases where restaurant or user might be deleted
    const { data: stamps, error } = await supabase
      .from("stamps" as any)
      .select(
        `
        id,
        photo_url,
        review_text,
        created_at,
        restaurant_id,
        restaurant:restaurants(id, name, slug, cuisine_types, address, avg_rating),
        user_id,
        user:profiles(id, full_name, avatar_url)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // If error, log but return empty array instead of 500
    if (error) {
      console.error("Error fetching stamps:", error);
      // Return empty array instead of error to prevent frontend crashes
      return NextResponse.json({ stamps: [] });
    }

    // If no stamps, return empty array
    if (!stamps || stamps.length === 0) {
      return NextResponse.json({ stamps: [] });
    }

    // Transform data for frontend, filtering out stamps without required data
    const transformed = stamps
      .filter((stamp: any) => stamp.photo_url || stamp.event_type) // Only include stamps with photos or event types
      .map((stamp: any) => ({
        id: stamp.id,
        photoUrl: stamp.photo_url || null,
        reviewText: stamp.review_text || null,
        createdAt: stamp.created_at,
        restaurant: stamp.restaurant
          ? {
              name: stamp.restaurant.name || "Unknown Restaurant",
              slug: stamp.restaurant.slug || null,
              cuisine: Array.isArray(stamp.restaurant.cuisine_types)
                ? stamp.restaurant.cuisine_types[0]
                : typeof stamp.restaurant.cuisine_types === "string"
                ? stamp.restaurant.cuisine_types
                : null,
              city: stamp.restaurant.address ? extractCity(stamp.restaurant.address) : null,
              rating: stamp.restaurant.avg_rating || null,
            }
          : null,
        userName: stamp.user?.full_name || "Anonymous",
        userAvatar: stamp.user?.avatar_url || null,
      }))
      .filter((stamp: any) => stamp.photoUrl || stamp.restaurant); // Filter out invalid stamps

    return NextResponse.json({ stamps: transformed });
  } catch (error: any) {
    console.error("Unexpected error in /api/stamps:", error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json({ stamps: [] });
  }
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
