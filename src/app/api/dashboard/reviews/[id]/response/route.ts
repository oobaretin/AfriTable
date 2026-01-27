import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, requireRestaurantOwner } from "@/lib/dashboard/auth";

const schema = z.object({
  response: z.string().min(1).max(2000),
});

export async function POST(request: Request, context: { params: { id: string } }) {
  assertSameOrigin();
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", message: "Response text is required" }, { status: 400 });
  }

  const { restaurantId } = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();

  // Verify review belongs to owner's restaurant
  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id, restaurant_id")
    .eq("id", context.params.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  if (!existing || existing.restaurant_id !== restaurantId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Update review with response
  const { data, error } = await supabase
    .from("reviews")
    .update({ restaurant_response: parsed.data.response })
    .eq("id", context.params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "update_failed", message: error.message }, { status: 400 });
  }

  return NextResponse.json({ review: data });
}
