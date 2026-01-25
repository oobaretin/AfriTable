import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

const patchSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(32).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  default_party_size: z.number().int().min(1).max(20).nullable().optional(),
  favorite_cuisines: z.array(z.string().min(1)).optional(),
  dietary_restrictions: z.array(z.string().min(1)).optional(),
  sms_opt_in: z.boolean().optional(),
  email_prefs: z.record(z.string(), z.any()).optional(),
});

export async function PATCH(request: Request) {
  const user = await requireAuth("/login?redirectTo=/profile");
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "update_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}

export async function GET() {
  const user = await requireAuth("/login?redirectTo=/profile");
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });
  return NextResponse.json({ profile: data, email: user.email });
}

