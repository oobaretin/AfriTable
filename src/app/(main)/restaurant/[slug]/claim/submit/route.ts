import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const formSchema = z.object({
  full_name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  phone: z.string().min(7).max(50),
  proof: z.string().max(5000).optional().nullable(),
});

export async function POST(request: Request, context: { params: { slug: string } }) {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.redirect(new URL(`/login?redirectTo=/restaurant/${encodeURIComponent(context.params.slug)}/claim`, request.url));
  }

  const formData = await request.formData();
  const raw = {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    proof: formData.get("proof") != null ? String(formData.get("proof")) : null,
  };

  const parsed = formSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(new URL(`/restaurant/${encodeURIComponent(context.params.slug)}/claim?error=invalid`, request.url));
  }

  // Lookup restaurant (bypass restaurants RLS which only exposes active restaurants)
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from("restaurants")
    .select("id,is_claimed")
    .eq("slug", context.params.slug)
    .maybeSingle();

  if (restaurantError || !restaurant) {
    return NextResponse.redirect(new URL(`/restaurants`, request.url));
  }

  if ((restaurant as any).is_claimed) {
    return NextResponse.redirect(new URL(`/restaurant/${encodeURIComponent(context.params.slug)}/claim?error=claimed`, request.url));
  }

  // Insert claim request under the user's session (RLS enforces user_id = auth.uid()).
  const { error: insertError } = await supabaseSSR.from("restaurant_claim_requests").insert({
    restaurant_id: (restaurant as any).id,
    user_id: user.id,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    proof: parsed.data.proof ?? null,
  });

  if (insertError) {
    // Handles duplicate pending (unique partial index) and other failures.
    return NextResponse.redirect(new URL(`/restaurant/${encodeURIComponent(context.params.slug)}/claim?error=submit_failed`, request.url));
  }

  return NextResponse.redirect(new URL(`/restaurant/${encodeURIComponent(context.params.slug)}/claim?submitted=1`, request.url));
}

