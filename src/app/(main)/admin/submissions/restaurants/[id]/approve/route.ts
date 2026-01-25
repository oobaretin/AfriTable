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

  const { data: updated } = await supabaseAdmin
    .from("restaurant_submissions")
    .update({ status: "approved" })
    .eq("id", submissionId)
    .eq("status", "verified")
    .select("id")
    .maybeSingle();

  if (updated) {
    await supabaseAdmin.from("submission_events").insert({ submission_id: submissionId, event: "approved", created_by: user.id });
  }

  return NextResponse.redirect(new URL("/admin/submissions?status=approved", request.url));
}

