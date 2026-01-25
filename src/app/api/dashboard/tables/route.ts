import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, requireRestaurantOwner } from "@/lib/dashboard/auth";

const createSchema = z.object({
  table_number: z.string().min(1).max(32),
  capacity: z.number().int().min(1).max(50),
  is_active: z.boolean().default(true),
});

export async function POST(request: Request) {
  assertSameOrigin();
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const { restaurantId } = await requireRestaurantOwner();
  const supabase = createSupabaseServerClient();

  // prevent duplicates
  const { data: existing } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("table_number", parsed.data.table_number)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "duplicate_table_number" }, { status: 409 });

  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({ restaurant_id: restaurantId, ...parsed.data })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "create_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ table: data });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const restaurantId = url.searchParams.get("restaurantId");
  const owner = await requireRestaurantOwner(restaurantId);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id,table_number,capacity,is_active")
    .eq("restaurant_id", owner.restaurantId)
    .order("table_number", { ascending: true });
  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  return NextResponse.json({ restaurantId: owner.restaurantId, tables: data ?? [] });
}

