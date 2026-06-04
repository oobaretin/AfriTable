import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createInviteToken, hashInviteToken, inviteExpiresAt } from "@/lib/auth/invite-token";
import { escapeHtml } from "@/lib/email/site-inbox";
import { sendSmtpMail } from "@/lib/email/smtp";

async function requireAdmin(request: Request) {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return { error: NextResponse.redirect(new URL("/login?redirectTo=/admin/partner-applications", request.url)) };
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: NextResponse.redirect(new URL("/", request.url)) };
  return { user };
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const authResult = await requireAdmin(request);
  if ("error" in authResult && authResult.error) return authResult.error;
  const adminUser = authResult.user!;

  const applicationId = context.params.id;
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: application } = await supabaseAdmin
    .from("partner_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) {
    return NextResponse.redirect(new URL("/admin/partner-applications?status=submitted", request.url));
  }

  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = inviteExpiresAt(7);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteLink = `${appUrl}/partner-invite?token=${encodeURIComponent(token)}`;

  const subject = "Your AfriTable partner application was approved";
  const textBody = `Hi ${application.contact_name},

Great news—${application.business_name} has been approved to join AfriTable.

Create your owner account and complete onboarding here:
${inviteLink}

This link expires in 7 days.

— AfriTable Partnerships`;

  const htmlBody = `<p>Hi ${escapeHtml(application.contact_name)},</p>
<p>Great news—<strong>${escapeHtml(application.business_name)}</strong> has been approved to join AfriTable.</p>
<p><a href="${inviteLink}">Create your owner account and complete onboarding</a></p>
<p>This link expires in 7 days.</p>
<p>— AfriTable Partnerships</p>`;

  const emailResult = await sendSmtpMail({
    to: application.email,
    subject,
    html: htmlBody,
    text: textBody,
  });

  if (!emailResult.ok) {
    console.log(`
PARTNER INVITE EMAIL (SMTP not configured)
To: ${application.email}
Subject: ${subject}

${textBody}
`);
  }

  await supabaseAdmin
    .from("partner_applications")
    .update({
      status: "invited",
      invited_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
      owner_invite_token_hash: tokenHash,
      owner_invite_token_expires_at: expiresAt,
      owner_invite_token_used_at: null,
    })
    .eq("id", applicationId);

  return NextResponse.redirect(new URL("/admin/partner-applications?status=invited", request.url));
}
