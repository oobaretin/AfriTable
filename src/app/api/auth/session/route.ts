import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Lightweight auth probe for debugging session cookies (no PII). */
export async function GET() {
  const cookieStore = cookies();
  const authCookies = cookieStore
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth"))
    .map((cookie) => cookie.name);

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const payload = {
    authenticated: Boolean(user),
    userId: user?.id ?? null,
    authCookieCount: authCookies.length,
    authCookieNames: authCookies,
    error: error?.message ?? null,
  };

  // #region agent log
  fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
    body: JSON.stringify({
      sessionId: "379971",
      runId: "auth-session-v3",
      hypothesisId: "H2",
      location: "api/auth/session",
      message: "session probe",
      data: payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
