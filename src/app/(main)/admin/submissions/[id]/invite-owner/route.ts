import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: { id: string } }) {
  const submissionId = context.params.id;

  // Admin only
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.redirect(new URL("/login?redirectTo=/admin/submissions", request.url));
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.redirect(new URL("/", request.url));

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: submission } = await supabaseAdmin
    .from("restaurant_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) return NextResponse.redirect(new URL("/admin/submissions?status=pending&error=not_found", request.url));

  if (!(submission as any)?.website && !(submission as any)?.submitted_by_email) {
    return NextResponse.redirect(new URL("/admin/submissions?error=no-contact", request.url));
  }

  const email = String((submission as any).owner_email ?? (submission as any).submitted_by_email ?? "").trim();

  // 🔔 Send invite email (stub for now)
  // Later: Resend / Postmark / Supabase Edge Function
  // Claim link: use the restaurant claim flow; the listing is created after conversion/approval.
  // Keeping log format close to the requested snippet for now.
  // eslint-disable-next-line no-console
  console.log(`
  INVITE OWNER EMAIL
  To: ${email}
  Restaurant: ${String((submission as any).name ?? "")}
  Claim link: /claim
  `);

  await supabaseAdmin
    .from("restaurant_submissions")
    .update({
      owner_invited: true,
      owner_invited_at: new Date().toISOString(),
      owner_email: email || null,
    })
    .eq("id", submissionId);

  return NextResponse.redirect(new URL("/admin/submissions", request.url));
}

