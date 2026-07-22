import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePostLoginPathForRole } from "@/lib/auth/post-login-path";
import { fetchProfileRole } from "@/lib/supabase/service-client";
import { sanitizeRedirectPath } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const redirectTo = sanitizeRedirectPath(request.nextUrl.searchParams.get("redirectTo"));

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ destination: redirectTo });
  }

  const { role, error } = await fetchProfileRole(user.id);
  const destination = resolvePostLoginPathForRole(role, redirectTo);

  return NextResponse.json({
    destination,
    profileRole: role,
    profileError: error,
  });
}
