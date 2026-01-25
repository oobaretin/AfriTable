import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, requireRestaurantOwner } from "@/lib/dashboard/auth";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  cuisine_types: z.array(z.string().min(1)).optional(),
  phone: z.string().min(7).max(32).nullable().optional(),
  price_range: z.number().int().min(1).max(4).optional(),
  description: z.string().max(500).nullable().optional(),
  address: z.any().optional(),
  images: z.array(z.string().min(1)).optional(),
  hours: z.any().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  assertSameOrigin();
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const owner = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("restaurants")
    .update(parsed.data)
    .eq("id", owner.restaurantId)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: "update_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ restaurant: data });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const restaurantId = url.searchParams.get("restaurantId");
  const owner = await requireRestaurantOwner(restaurantId);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", owner.restaurantId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  return NextResponse.json({ restaurant: data });
}

