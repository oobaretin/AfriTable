import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin(request: Request, redirectTo: string) {
  const supabaseSSR = createSupabaseServerClient();
  const { data: auth } = await supabaseSSR.auth.getUser();
  const user = auth.user;
  if (!user) return { error: NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(redirectTo)}`, request.url)) };
  const { data: profile } = await supabaseSSR.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: NextResponse.redirect(new URL("/", request.url)) };
  return { user };
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const redirectTo = "/admin/table-requests";
  const authResult = await requireAdmin(request, redirectTo);
  if ("error" in authResult && authResult.error) return authResult.error;

  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin.from("table_requests").update({ status: "cancelled" }).eq("id", context.params.id);

  return NextResponse.redirect(new URL(`${redirectTo}?status=cancelled`, request.url));
}
