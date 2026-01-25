import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

function buildInviteEmail(params: { restaurantName: string; claimLink: string }) {
  const subject = "Your restaurant was submitted to AfriTable";
  const body = `Hi,

Your restaurant ${params.restaurantName} was recently submitted to AfriTable — a platform helping people discover African restaurants.

If you are the owner or manager, you can claim and manage your listing here:
👉 ${params.claimLink}

Claiming lets you:
• Verify details
• Upload photos
• Manage bookings

— AfriTable Team`;

  return { subject, body };
}

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
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) return NextResponse.redirect(new URL("/admin/submissions?status=submitted&error=not_found", request.url));

  // We need an email address to invite the owner.
  if (!(submission as any)?.owner_email && !(submission as any)?.submitted_by_email) {
    return NextResponse.redirect(new URL("/admin/submissions?error=no-contact", request.url));
  }

  const email = String((submission as any).owner_email ?? (submission as any).submitted_by_email ?? "").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const claimLink = `${appUrl}/restaurant-signup?from=submission&submissionId=${encodeURIComponent(submissionId)}`;

  // 🔔 Send invite email (stub for now)
  // Later: Resend / Postmark / Supabase Edge Function
  // Using requested copy (simple, respectful).
  const { subject, body } = buildInviteEmail({
    restaurantName: String((submission as any).name ?? ""),
    claimLink,
  });

  // eslint-disable-next-line no-console
  console.log(`
INVITE OWNER EMAIL (STUB)
To: ${email}
Subject: ${subject}

${body}
`);

  await supabaseAdmin
    .from("restaurant_submissions")
    .update({
      owner_invited: true,
      owner_invited_at: new Date().toISOString(),
      owner_email: email || null,
      status: "owner_invited",
    })
    .eq("id", submissionId);

  return NextResponse.redirect(new URL("/admin/submissions", request.url));
}

