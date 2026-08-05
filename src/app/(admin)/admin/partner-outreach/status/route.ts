import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  slug: z.string().min(1),
  status: z.enum(["pending", "sent", "replied", "claimed", "declined", "skipped"]),
  notes: z.string().max(4000).optional(),
});

async function requireAdmin() {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user };
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult && authResult.error) return authResult.error;
  const adminUser = authResult.user!;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { slug, status, notes } = parsed.data;
  const now = new Date().toISOString();

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: existing } = await supabaseAdmin
    .from("partner_outreach_status")
    .select("contacted_at")
    .eq("slug", slug)
    .maybeSingle();

  const contactedAt =
    status === "sent" || status === "replied"
      ? (existing as { contacted_at?: string | null } | null)?.contacted_at ?? now
      : (existing as { contacted_at?: string | null } | null)?.contacted_at ?? null;

  const { error } = await supabaseAdmin.from("partner_outreach_status").upsert(
    {
      slug,
      status,
      notes: notes ?? null,
      contacted_at: contactedAt,
      updated_at: now,
      updated_by: adminUser.id,
    },
    { onConflict: "slug" },
  );

  if (error) {
    console.error("[partner-outreach/status]", error);
    return NextResponse.json({ error: "save_failed", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, status });
}
