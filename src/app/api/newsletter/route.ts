import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { rateLimitOrPass } from "@/lib/security/rateLimit";

const schema = z.object({
  email: z.string().email(),
  source: z.string().max(80).optional(),
});

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

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

  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  const audienceId = requireEnv("RESEND_AUDIENCE_ID");

  // Add contact to audience. If it already exists, update it (idempotent).
  const email = parsed.data.email;
  const properties = parsed.data.source ? { source: parsed.data.source } : undefined;

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

    // Ensure the contact is present/up-to-date in the audience.
    const updated = await resend.contacts.update({ email, audienceId, properties });
    if ((updated as any)?.error) {
      const uerr = (updated as any).error as { message?: string } | undefined;
      return NextResponse.json(
        { error: "subscribe_failed", message: uerr?.message || "Could not subscribe." },
        { status: 400 }
      );
    }
  }

  // Optional welcome email (best-effort)
  const from = process.env.RESEND_FROM_EMAIL;
  if (from) {
    try {
      await resend.emails.send({
        from,
        to: email,
        subject: "Welcome to AfriTable",
        html: `<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;line-height:1.5">
  <h2 style="margin:0 0 12px">Welcome to AfriTable</h2>
  <p style="margin:0 0 12px">You’re subscribed for updates on new African &amp; Caribbean restaurants, cities, and reservation features.</p>
  <p style="margin:0">Explore restaurants: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/restaurants">Browse</a></p>
</div>`,
      });
    } catch {
      // best-effort: ignore
    }
  }

  return NextResponse.json({ ok: true });
}

