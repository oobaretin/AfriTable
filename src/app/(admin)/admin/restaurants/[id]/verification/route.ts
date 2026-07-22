import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  key: z.enum(["name", "address", "phone", "hours", "photos", "description"]),
  value: z.boolean(),
});

export async function POST(request: Request, context: { params: { id: string } }) {
  const restaurantId = context.params.id;

  // AuthZ: admin only (middleware should also block)
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

  // Read-merge-write (handles jsonb merge correctly for our small payload).
  const { data: current, error: readErr } = await supabaseAdmin
    .from("restaurants")
    .select("verification")
    .eq("id", restaurantId)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: "read_failed" }, { status: 500 });

  const base = (current as any)?.verification;
  const merged =
    base && typeof base === "object" && !Array.isArray(base)
      ? { ...(base as any), [parsed.data.key]: parsed.data.value }
      : { [parsed.data.key]: parsed.data.value };

  const { error: writeErr } = await supabaseAdmin.from("restaurants").update({ verification: merged }).eq("id", restaurantId);
  if (writeErr) return NextResponse.json({ error: "update_failed", message: writeErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, verification: merged });
}

