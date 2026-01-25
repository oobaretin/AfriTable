import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/auth/slug";
import type { Json } from "@db/database.types";

export async function POST(request: Request, context: { params: { id: string } }) {
  const submissionId = context.params.id;

  // Admin only
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.redirect(new URL("/login?redirectTo=/admin/submissions", request.url));
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.redirect(new URL("/", request.url));

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: submission } = await supabaseAdmin
    .from("restaurant_submissions")
    .select("id,name,city,state,cuisine_types,address,phone,website,notes,status")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission || (submission as any).status !== "pending") {
    return NextResponse.redirect(new URL("/admin/submissions?status=pending", request.url));
  }

  const baseSlug = slugify(`${(submission as any).name}-${(submission as any).city}-${(submission as any).state}`);

  const address: Json = {
    street: (submission as any).address ?? null,
    city: (submission as any).city,
    state: (submission as any).state,
    zip: null,
    coordinates: null,
  };

  const insertRestaurant = async (slug: string) =>
    supabaseAdmin
      .from("restaurants")
      .insert({
        owner_id: user.id, // admin owns until claimed/approved
        name: (submission as any).name,
        slug,
        cuisine_types: ((submission as any).cuisine_types ?? []) as string[],
        address,
        phone: (submission as any).phone ?? null,
        price_range: 2,
        description: (submission as any).notes ?? null,
        images: [],
        hours: [],
        is_active: false,
        is_claimed: false,
        claimed_by: null,
        claimed_at: null,
      })
      .select("id")
      .single();

  let { data: restaurant, error } = await insertRestaurant(baseSlug);
  if (error) {
    const fallback = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const retry = await insertRestaurant(fallback);
    restaurant = retry.data ?? null;
    error = retry.error ?? null;
  }

  if (!restaurant || error) {
    return NextResponse.redirect(new URL("/admin/submissions?status=pending&error=convert_failed", request.url));
  }

  await supabaseAdmin
    .from("restaurant_submissions")
    .update({ status: "converted" })
    .eq("id", submissionId)
    .eq("status", "pending");

  return NextResponse.redirect(new URL(`/admin/restaurants/${(restaurant as any).id}/review`, request.url));
}

