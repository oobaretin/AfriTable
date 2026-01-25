import "server-only";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

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
    .select("id,name,city,state,owner_email,submitted_by_email,owner_invited,status")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) return NextResponse.redirect(new URL("/admin/submissions?status=pending&error=not_found", request.url));

  const targetEmail = ((submission as any).owner_email ?? (submission as any).submitted_by_email ?? "").toString().trim();
  if (!targetEmail) {
    return NextResponse.redirect(new URL("/admin/submissions?status=pending&error=missing_email", request.url));
  }

  // Mark invited (idempotent)
  await supabaseAdmin
    .from("restaurant_submissions")
    .update({
      owner_invited: true,
      owner_invited_at: new Date().toISOString(),
      owner_email: (submission as any).owner_email ?? targetEmail,
    })
    .eq("id", submissionId);

  // Best-effort email (only if configured)
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    try {
      const resend = new Resend(apiKey);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const prefill = new URLSearchParams({
        name: String((submission as any).name ?? ""),
        city: String((submission as any).city ?? ""),
        state: String((submission as any).state ?? ""),
        from: "community_submission",
      }).toString();

      await resend.emails.send({
        from,
        to: targetEmail,
        subject: `AfriTable: Claim and manage your restaurant listing`,
        html: `<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;line-height:1.5">
  <h2 style="margin:0 0 12px">You’ve been invited to AfriTable</h2>
  <p style="margin:0 0 12px">
    A community member submitted <strong>${String((submission as any).name ?? "your restaurant")}</strong> in ${String(
          (submission as any).city ?? "",
        )}, ${String((submission as any).state ?? "")}.
  </p>
  <p style="margin:0 0 12px">
    Create your owner account to manage reservations, photos, hours, and availability.
  </p>
  <p style="margin:0 0 12px">
    <a href="${appUrl}/restaurant-signup?${prefill}">Create owner account</a>
  </p>
  <p style="margin:0;color:#6b7280;font-size:12px">If this isn’t you, you can ignore this email.</p>
</div>`,
      });
    } catch {
      // best-effort
    }
  }

  return NextResponse.redirect(new URL("/admin/submissions?status=pending&invited=1", request.url));
}

