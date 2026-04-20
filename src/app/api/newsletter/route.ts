import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendSiteInboxNotification } from "@/lib/email/site-inbox";
import { sendSmtpMail } from "@/lib/email/smtp";
import { rateLimitOrPass } from "@/lib/security/rateLimit";
import { getWelcomeEmailHTML } from "@/lib/emails/welcome-email";

const schema = z.object({
  email: z.string().email(),
  source: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`newsletter:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: rl.message },
      { status: rl.status, headers: rl.retryAfterSeconds ? { "Retry-After": String(rl.retryAfterSeconds) } : undefined }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const email = parsed.data.email;

  await sendSiteInboxNotification({
    subject: `[AfriTable] Newsletter signup: ${email}`,
    htmlBody: `<p>New newsletter subscriber: <strong>${escapeHtml(email)}</strong></p>
${parsed.data.source ? `<p><strong>Source:</strong> ${escapeHtml(parsed.data.source)}</p>` : ""}`,
    replyTo: email,
  });

  // Welcome email to subscriber (best-effort, SMTP — no Resend audience)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const html = getWelcomeEmailHTML({
      logoUrl: `${appUrl}/logo.png`,
      restaurantsUrl: `${appUrl}/restaurants`,
      appUrl,
      unsubscribeUrl: `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}`,
    });

    await sendSmtpMail({
      to: email,
      subject: "Welcome to AfriTable",
      html,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }

  return NextResponse.json({ ok: true });
}
