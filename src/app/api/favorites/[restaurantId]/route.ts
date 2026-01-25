import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

export async function DELETE(_request: Request, context: { params: { restaurantId: string } }) {
  const user = await requireAuth("/login");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("restaurant_id", context.params.restaurantId);

  if (error) return NextResponse.json({ error: "delete_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

