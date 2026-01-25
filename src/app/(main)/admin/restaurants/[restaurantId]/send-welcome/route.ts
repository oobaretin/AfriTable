import "server-only";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export async function POST(request: Request, context: { params: { restaurantId: string } }) {
  const restaurantId = context.params.restaurantId;

  // AuthZ: admin only
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.redirect(new URL("/login?redirectTo=/admin/restaurants/pending", request.url));
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.redirect(new URL("/", request.url));

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id,name,owner_id,slug,is_active")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) return NextResponse.redirect(new URL("/admin/restaurants/pending", request.url));

  const owner = await supabaseAdmin.auth.admin.getUserById((restaurant as any).owner_id);
  const to = owner.data?.user?.email;
  if (!to) return NextResponse.redirect(new URL("/admin/restaurants/pending", request.url));

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resend = new Resend(requireEnv("RESEND_API_KEY"));

  // Best-effort welcome email. (Credentials are generated locally during import; this email is informational.)
  await resend.emails.send({
    from: requireEnv("RESEND_FROM_EMAIL"),
    to,
    subject: `Welcome to AfriTable — ${String((restaurant as any).name)}`,
    html: `<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;line-height:1.6">
      <h2 style="margin:0 0 12px">Welcome to AfriTable</h2>
      <p style="margin:0 0 12px">Your restaurant listing <strong>${String((restaurant as any).name)}</strong> has been created.</p>
      <p style="margin:0 0 12px">Status: <strong>${(restaurant as any).is_active ? "Active" : "Pending approval"}</strong></p>
      <p style="margin:0 0 12px">You can sign in any time here: <a href="${appBaseUrl}/login">${appBaseUrl}/login</a></p>
      <p style="margin:0">Questions? Reply to this email and we’ll help you get set up.</p>
    </div>`,
  });

  return NextResponse.redirect(new URL("/admin/restaurants/pending", request.url));
}

