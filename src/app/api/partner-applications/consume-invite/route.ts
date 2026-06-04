import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hashInviteToken } from "@/lib/auth/invite-token";

const bodySchema = z.object({
  token: z.string().min(1),
  applicationId: z.string().uuid(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { token, applicationId } = parsed.data;
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: application } = await supabaseAdmin
    .from("partner_applications")
    .select("id,owner_invite_token_hash,owner_invite_token_expires_at,owner_invite_token_used_at,status")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application || application.owner_invite_token_hash !== hashInviteToken(token)) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
  }

  if (application.owner_invite_token_used_at) {
    return NextResponse.json({ ok: true, alreadyUsed: true });
  }

  const expired =
    application.owner_invite_token_expires_at &&
    new Date(application.owner_invite_token_expires_at).getTime() < Date.now();

  if (expired) {
    return NextResponse.json({ error: "expired_invite" }, { status: 400 });
  }

  await supabaseAdmin
    .from("partner_applications")
    .update({
      status: "approved",
      owner_invite_token_used_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  return NextResponse.json({ ok: true });
}
