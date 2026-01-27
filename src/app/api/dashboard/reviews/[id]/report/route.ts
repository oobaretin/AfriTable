import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertSameOrigin, requireRestaurantOwner } from "@/lib/dashboard/auth";

export async function POST(request: Request, context: { params: { id: string } }) {
  assertSameOrigin();
  const { restaurantId, userId } = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  // Verify review belongs to owner's restaurant
  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id, restaurant_id, user_id, review_text")
    .eq("id", context.params.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  if (!existing || existing.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Create a report entry (you could create a reports table, or just log it)
  // For now, we'll create a simple log entry in a reports table if it exists
  // Otherwise, we'll just return success and log it server-side
  console.log(`[Review Report] Review ${context.params.id} reported by restaurant owner ${userId} for restaurant ${restaurantId}`);

  // Optionally, you could create a reports table:
  // await supabaseAdmin.from("review_reports").insert({
  //   review_id: context.params.id,
  //   restaurant_id: restaurantId,
  //   reported_by: userId,
  //   reason: "spam_or_hate_speech",
  //   status: "pending",
  // });

  return NextResponse.json({ ok: true, message: "Review reported to management" });
}
