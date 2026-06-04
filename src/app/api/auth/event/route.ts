import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AuthEventBody = {
  stage?: string;
  errorMessage?: string | null;
  hasUser?: boolean;
  clientHasSession?: boolean;
  authCookieCount?: number;
};

/** Records the latest auth callback outcome in a short-lived cookie (no PII). */
export async function POST(request: Request) {
  let body: AuthEventBody = {};
  try {
    body = (await request.json()) as AuthEventBody;
  } catch {
    body = {};
  }

  const summary = {
    stage: body.stage ?? "unknown",
    errorMessage: body.errorMessage ?? null,
    hasUser: Boolean(body.hasUser),
    clientHasSession: Boolean(body.clientHasSession),
    authCookieCount: body.authCookieCount ?? 0,
    at: new Date().toISOString(),
  };

  const response = NextResponse.json({ ok: true, summary });
  response.cookies.set("auth_last_event", JSON.stringify(summary), {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    httpOnly: false,
    ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
  });

  // #region agent log
  fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
    body: JSON.stringify({
      sessionId: "379971",
      runId: "auth-client-callback-v5",
      hypothesisId: "H5",
      location: "api/auth/event",
      message: "auth event recorded",
      data: summary,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return response;
}
