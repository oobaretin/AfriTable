import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, requireRestaurantOwner } from "@/lib/dashboard/auth";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "seated", "completed", "cancelled", "no_show"]).optional(),
  internal_note: z.string().max(1000).nullable().optional(),
  assigned_table_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  assertSameOrigin();
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const supabase = createSupabaseServerClient();

  // Determine restaurant owner scope (we also validate the reservation belongs to the owner's restaurant)
  const owner = await requireRestaurantOwner();

  const { data: existing, error: existingError } = await supabase
    .from("reservations")
    .select("id,restaurant_id")
    .eq("id", context.params.id)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  if (!existing || existing.restaurant_id !== owner.restaurantId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await supabase
    .from("reservations")
    .update(parsed.data)
    .eq("id", context.params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "update_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ reservation: data });
}

