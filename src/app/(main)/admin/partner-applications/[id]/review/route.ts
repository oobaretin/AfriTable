import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin(request: Request) {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return { error: NextResponse.redirect(new URL("/login?redirectTo=/admin/partner-applications", request.url)) };
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: NextResponse.redirect(new URL("/", request.url)) };
  return { user };
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const authResult = await requireAdmin(request);
  if ("error" in authResult && authResult.error) return authResult.error;
  const adminUser = authResult.user!;

  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin
    .from("partner_applications")
    .update({
      status: "under_review",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    })
    .eq("id", context.params.id);

  return NextResponse.redirect(new URL("/admin/partner-applications?status=under_review", request.url));
}
