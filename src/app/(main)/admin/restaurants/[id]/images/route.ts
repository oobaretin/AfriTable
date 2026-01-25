import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  action: z.enum(["add", "remove"]),
  url: z.string().min(1).max(2000),
});

export async function POST(request: Request, context: { params: { id: string } }) {
  const restaurantId = context.params.id;

  // AuthZ: admin only
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: current, error: readErr } = await supabaseAdmin
    .from("restaurants")
    .select("images")
    .eq("id", restaurantId)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: "read_failed" }, { status: 500 });

  const existing = ((current as any)?.images ?? []) as string[];
  const u = parsed.data.url.trim();

  const next =
    parsed.data.action === "add"
      ? Array.from(new Set([u, ...existing])).slice(0, 12)
      : existing.filter((x) => x !== u);

  const { error: writeErr } = await supabaseAdmin.from("restaurants").update({ images: next }).eq("id", restaurantId);
  if (writeErr) return NextResponse.json({ error: "update_failed", message: writeErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, images: next });
}

