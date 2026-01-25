import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: { id: string } }) {
  const restaurantId = context.params.id;

  // AuthZ: admin only
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.redirect(new URL("/login?redirectTo=/admin/restaurants/pending", request.url));
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.redirect(new URL("/", request.url));

  const supabaseAdmin = createSupabaseAdminClient();

  // Only approve listings that are claimed but not yet active.
  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from("restaurants")
    .select("id,is_claimed,is_active,claimed_by")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restaurantError || !restaurant) {
    return NextResponse.redirect(new URL("/admin/restaurants/pending?error=not_found", request.url));
  }

  if ((restaurant as any).is_active) {
    return NextResponse.redirect(new URL("/admin/restaurants/pending?info=already_active", request.url));
  }

  if (!(restaurant as any).is_claimed || !(restaurant as any).claimed_by) {
    return NextResponse.redirect(new URL("/admin/restaurants/pending?error=not_claimed", request.url));
  }

  const claimedBy = String((restaurant as any).claimed_by);

  // Promote the claimant to restaurant_owner
  await supabaseAdmin.from("profiles").update({ role: "restaurant_owner" }).eq("id", claimedBy);

  // Activate restaurant and transfer ownership to claimant
  await supabaseAdmin
    .from("restaurants")
    .update({ owner_id: claimedBy, is_active: true })
    .eq("id", restaurantId);

  return NextResponse.redirect(new URL("/admin/restaurants/pending", request.url));
}

