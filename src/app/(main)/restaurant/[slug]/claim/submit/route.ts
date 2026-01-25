import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/dashboard/auth";

const formSchema = z.object({
  full_name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  phone: z.string().min(7).max(50),
  proof: z.string().max(5000).optional().nullable(),
});

export async function POST(request: Request, context: { params: { slug: string } }) {
  // Basic CSRF protection for form posts
  assertSameOrigin();

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

  // Create pending owner account (service-role only)
  const randomPassword = Math.random().toString(36).slice(-12);
  const { data: created, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: randomPassword,
    email_confirm: true,
  });

  if (createUserError || !created?.user?.id) {
    return NextResponse.redirect(new URL(`/restaurant/${encodeURIComponent(context.params.slug)}/claim?error=user_create_failed`, request.url));
  }

  const pendingOwnerId = created.user.id;

  // Create profile (must exist before claimed_by due to FK)
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: pendingOwnerId,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    role: "pending_owner",
  });

  if (profileError) {
    return NextResponse.redirect(new URL(`/restaurant/${encodeURIComponent(context.params.slug)}/claim?error=profile_create_failed`, request.url));
  }

  // Mark restaurant claimed
  const { error: claimError } = await supabaseAdmin
    .from("restaurants")
    .update({
      is_claimed: true,
      claimed_by: pendingOwnerId,
      claimed_at: new Date().toISOString(),
    })
    .eq("slug", context.params.slug)
    .eq("is_claimed", false);

  if (claimError) {
    return NextResponse.redirect(new URL(`/restaurant/${encodeURIComponent(context.params.slug)}/claim?error=claim_failed`, request.url));
  }

  return NextResponse.redirect(new URL("/claim-submitted", request.url));
}

