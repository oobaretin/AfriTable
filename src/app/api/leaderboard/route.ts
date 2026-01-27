import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Cache for 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let cachedData: { ambassadors: any[]; timestamp: number } | null = null;

export async function GET() {
  // Check cache first
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json({ ambassadors: cachedData.ambassadors });
  }

  const supabase = createSupabaseServerClient();

  try {
    // Get all completed/past reservations grouped by user_id
    // Count unique restaurants per user
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("user_id, restaurant_id, reservation_date, status")
      .or("status.eq.completed,status.eq.no_show")
      .order("reservation_date", { ascending: false });

    if (resError) {
      console.error("Error fetching reservations:", resError);
      return NextResponse.json({ error: "query_failed", message: resError.message }, { status: 500 });
    }

    // Group by user_id and count unique restaurants
    const userStampsMap = new Map<string, Set<string>>();

    const currentDate = new Date();
    (reservations || []).forEach((r: any) => {
      // Only count past reservations (completed or date has passed)
      if (!r.reservation_date) return;
      const resDate = new Date(r.reservation_date);
      if (resDate > currentDate && r.status !== "completed" && r.status !== "no_show") return;

      if (!userStampsMap.has(r.user_id)) {
        userStampsMap.set(r.user_id, new Set());
      }
      if (r.restaurant_id) {
        userStampsMap.get(r.user_id)!.add(r.restaurant_id);
      }
    });

    // Convert to array of { user_id, stampCount }
    const userStamps = Array.from(userStampsMap.entries())
      .map(([user_id, restaurantIds]) => ({
        user_id,
        stampCount: restaurantIds.size,
      }))
      .filter((u) => u.stampCount > 0) // Only users with at least 1 stamp
      .sort((a, b) => b.stampCount - a.stampCount)
      .slice(0, 20); // Top 20

    if (userStamps.length === 0) {
      cachedData = { ambassadors: [], timestamp: now };
      return NextResponse.json({ ambassadors: [] });
    }

    // Fetch user profiles
    const userIds = userStamps.map((u) => u.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, city, avatar_url")
      .in("id", userIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      return NextResponse.json({ error: "query_failed", message: profileError.message }, { status: 500 });
    }

    // Map profiles to stamp counts
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const ambassadors = userStamps
      .map((u) => {
        const profile = profileMap.get(u.user_id);
        if (!profile) return null;

        const stampCount = u.stampCount;
        let rank: "Gold" | "Silver" | "Bronze" = "Bronze";
        if (stampCount >= 20) rank = "Gold";
        else if (stampCount >= 10) rank = "Silver";

        return {
          id: u.user_id,
          name: profile.full_name || "Anonymous Diner",
          stamps: stampCount,
          rank,
          city: profile.city || null,
          avatar_url: profile.avatar_url || null,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    // Update cache
    cachedData = { ambassadors, timestamp: now };

    return NextResponse.json({ ambassadors });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}
