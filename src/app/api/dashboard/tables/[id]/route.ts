import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, requireRestaurantOwner } from "@/lib/dashboard/auth";

const patchSchema = z.object({
  table_number: z.string().min(1).max(32).optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  assertSameOrigin();
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const owner = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("restaurant_tables")
    .select("id,restaurant_id")
    .eq("id", context.params.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  if (!existing || existing.restaurant_id !== owner.restaurantId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await supabase
    .from("restaurant_tables")
    .update(parsed.data)
    .eq("id", context.params.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: "update_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ table: data });
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  assertSameOrigin();
  const owner = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("restaurant_tables")
    .select("id,restaurant_id")
    .eq("id", context.params.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  if (!existing || existing.restaurant_id !== owner.restaurantId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase.from("restaurant_tables").delete().eq("id", context.params.id);
  if (error) return NextResponse.json({ error: "delete_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

