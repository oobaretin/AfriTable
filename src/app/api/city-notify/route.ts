import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { rateLimitOrPass } from "@/lib/security/rateLimit";

const schema = z.object({
  email: z.string().email(),
  city: z.string().min(1).max(100),
  source: z.string().max(80).optional(),
});

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

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

  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const audienceId = requireEnv("RESEND_AUDIENCE_ID");

  // Add contact to audience with city preference
  const email = parsed.data.email;
  const city = parsed.data.city;
  const properties = {
    ...(parsed.data.source ? { source: parsed.data.source } : {}),
    city: city,
    notify_city: "true", // Tag to identify city notification subscribers
  };

  const created = await resend.contacts.create({ email, audienceId, properties });
  if ((created as any)?.error) {
    const err = (created as any).error as { message?: string; name?: string; statusCode?: number } | undefined;
    const isAlready =
      err?.name === "already_exists" ||
      err?.statusCode === 409 ||
      String(err?.message ?? "").toLowerCase().includes("already");

    if (!isAlready) {
      return NextResponse.json(
        { error: "subscribe_failed", message: err?.message || "Could not subscribe." },
        { status: 400 }
      );
    }

    // Update existing contact with city preference
    const updated = await resend.contacts.update({ email, audienceId, properties });
    if ((updated as any)?.error) {
      const uerr = (updated as any).error as { message?: string } | undefined;
      return NextResponse.json(
        { error: "subscribe_failed", message: uerr?.message || "Could not update subscription." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true, message: `You'll be notified when we launch in ${city}!` });
}
