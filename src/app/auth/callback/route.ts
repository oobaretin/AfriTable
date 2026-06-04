import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";
import { assertSupabaseJwtShape } from "@/lib/supabase/validate-jwt";
import { sanitizeRedirectPath } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function profilePatchFromUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email ||
    "AfriTable user";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;

  return {
    id: user.id,
    full_name: fullName,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };
}

function hasAuthTokenCookies(response: NextResponse): boolean {
  return response.cookies.getAll().some((cookie) => cookie.name.includes("auth-token"));
}

/** Wait until session cookies are written onto the redirect response. */
function waitForSessionCookies(
  supabase: ReturnType<typeof createServerClient<Database>>,
  response: NextResponse,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (hasAuthTokenCookies(response)) {
        resolve();
        return;
      }
      reject(new Error("auth_cookie_timeout"));
    }, 8000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || hasAuthTokenCookies(response)) {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve();
      }
    });
  });
}

async function ensureSessionCookiesOnResponse(
  supabase: ReturnType<typeof createServerClient<Database>>,
  response: NextResponse,
  session: Session | null,
): Promise<void> {
  if (!session || hasAuthTokenCookies(response)) return;

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next"));
  const oauthError = searchParams.get("error");

  if (oauthError) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", oauthError);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "missing_oauth_code");
    return NextResponse.redirect(loginUrl);
  }

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assertSupabaseJwtShape(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

  const redirectUrl = new URL(next, origin);
  const response = NextResponse.redirect(redirectUrl);
  const cookieStore = cookies();
  const isProduction = process.env.NODE_ENV === "production";

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const merged = {
            ...options,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
            ...(isProduction ? { secure: true } : {}),
          };
          try {
            cookieStore.set(name, value, merged);
          } catch {
            // cookieStore may be read-only in some contexts
          }
          response.cookies.set(name, value, merged);
        });
      },
    },
  });

  const cookiesReady = waitForSessionCookies(supabase, response);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // #region agent log
    fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
      body: JSON.stringify({
        sessionId: "379971",
        runId: "auth-session-v3",
        hypothesisId: "H1",
        location: "auth/callback:exchange",
        message: "exchange failed",
        data: { errorMessage: error.message },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "oauth_exchange_failed");
    return NextResponse.redirect(loginUrl);
  }

  try {
    await cookiesReady;
  } catch {
    await ensureSessionCookiesOnResponse(supabase, response, data.session);
    if (!hasAuthTokenCookies(response)) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "oauth_exchange_failed");
      return NextResponse.redirect(loginUrl);
    }
  }

  await ensureSessionCookiesOnResponse(supabase, response, data.session);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("profiles").upsert(profilePatchFromUser(user), { onConflict: "id" });
  }

  const cookieCount = response.cookies.getAll().length;
  const authCookieCount = response.cookies.getAll().filter((c) => c.name.includes("auth-token")).length;

  // #region agent log
  fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
    body: JSON.stringify({
      sessionId: "379971",
      runId: "auth-session-v3",
      hypothesisId: "H1",
      location: "auth/callback:complete",
      message: "callback cookies applied",
      data: { hasUser: Boolean(user), cookieCount, authCookieCount, redirectTo: next },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return response;
}
