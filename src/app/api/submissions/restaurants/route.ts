import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendSiteInboxNotification } from "@/lib/email/site-inbox";
import { rateLimitOrPass } from "@/lib/security/rateLimit";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  name: z.string().min(2).max(200),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(40),
  cuisine_types: z.array(z.string().min(1).max(50)).max(10).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(80).nullable().optional(),
  website: z.string().url().max(2000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  submitted_by_email: z.string().email().max(320),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`submit_restaurant:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited", message: rl.message }, { status: rl.status });
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", message: "Please check the form fields and try again." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurant_submissions")
    .insert({
      name: parsed.data.name,
      city: parsed.data.city,
      state: parsed.data.state,
      cuisine_types: parsed.data.cuisine_types ?? null,
      address: parsed.data.address ?? null,
      phone: parsed.data.phone ?? null,
      website: parsed.data.website ?? null,
      notes: parsed.data.notes ?? null,
      submitted_by_email: parsed.data.submitted_by_email,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "insert_failed", message: error.message }, { status: 400 });
  }

  // Best-effort event log (service role)
  try {
    if ((data as any)?.id) {
      const admin = createSupabaseAdminClient();
      await admin.from("submission_events").insert({ submission_id: (data as any).id, event: "submitted", created_by: null });
    }
  } catch {
    // best-effort
  }

  const p = parsed.data;
  const cuisines = p.cuisine_types?.length ? p.cuisine_types.join(", ") : "—";
  await sendSiteInboxNotification({
    subject: `[AfriTable] Restaurant suggestion: ${p.name}`,
    htmlBody: `<p><strong>Submission ID:</strong> ${escapeHtml(String((data as { id?: string })?.id ?? ""))}</p>
<p><strong>Name:</strong> ${escapeHtml(p.name)}</p>
<p><strong>Location:</strong> ${escapeHtml(p.city)}, ${escapeHtml(p.state)}</p>
<p><strong>Cuisine types:</strong> ${escapeHtml(cuisines)}</p>
<p><strong>Submitted by:</strong> ${escapeHtml(p.submitted_by_email)}</p>
${p.address ? `<p><strong>Address:</strong> ${escapeHtml(p.address)}</p>` : ""}
${p.phone ? `<p><strong>Phone:</strong> ${escapeHtml(p.phone)}</p>` : ""}
${p.website ? `<p><strong>Website:</strong> ${escapeHtml(p.website)}</p>` : ""}
${p.notes ? `<p><strong>Notes:</strong><br/>${escapeHtml(p.notes).replace(/\n/g, "<br/>")}</p>` : ""}`,
    replyTo: p.submitted_by_email,
  });

  return NextResponse.json({ ok: true, submission: data });
}

