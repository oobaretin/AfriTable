import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendSiteInboxNotification } from "@/lib/email/site-inbox";
import { rateLimitOrPass } from "@/lib/security/rateLimit";

const schema = z.object({
  email: z.string().email(),
  city: z.string().min(1).max(100),
  source: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`city-notify:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: rl.message },
      { status: rl.status, headers: rl.retryAfterSeconds ? { "Retry-After": String(rl.retryAfterSeconds) } : undefined }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", message: "Please check your email and city selection." }, { status: 400 });
  }

  const email = parsed.data.email;
  const city = parsed.data.city;

  await sendSiteInboxNotification({
    subject: `[AfriTable] City launch notify: ${city}`,
    htmlBody: `<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>City:</strong> ${escapeHtml(city)}</p>
${parsed.data.source ? `<p><strong>Source:</strong> ${escapeHtml(parsed.data.source)}</p>` : ""}`,
    replyTo: email,
  });

  return NextResponse.json({ ok: true, message: `You'll be notified when we launch in ${city}!` });
}
