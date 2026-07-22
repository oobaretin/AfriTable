import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sanitizeRedirectPath } from "@/lib/auth/config";
import { fetchProfileRole } from "@/lib/supabase/service-client";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function isProtectedPath(pathname: string): boolean {
  // Allow guest booking flow
  if (pathname.startsWith("/reservations/new")) return false;
  return pathname.startsWith("/dashboard") || pathname.startsWith("/reservations") || pathname.startsWith("/admin");
}

function isGuestOnlyPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Create a response we can attach refreshed auth cookies to.
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Check if required env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // If env vars are missing, allow the request to proceed (will fail at page level)
    // This prevents middleware from breaking the entire app during development
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const isProduction = process.env.NODE_ENV === "production";
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
            ...(isProduction ? { secure: true } : {}),
          });
        });
      },
    },
  });

  // Refresh session if needed (required for SSR).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(url.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", url.pathname + url.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isGuestOnlyPath(url.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    let destination = sanitizeRedirectPath(url.searchParams.get("redirectTo"));
    const { role: profileRole } = await fetchProfileRole(user.id);
    if (profileRole === "admin" && (destination === "/" || destination === "/reservations")) {
      destination = "/admin";
    }
    redirectUrl.pathname = destination;
    redirectUrl.search = "";
    // #region agent log
    fetch("http://127.0.0.1:7334/ingest/db39d61a-a551-4eae-93f4-8f741a47f367", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3435b4" },
      body: JSON.stringify({
        sessionId: "3435b4",
        runId: "pre-fix",
        hypothesisId: "C-E",
        location: "middleware.ts:guest-only-redirect",
        message: "Logged-in user redirected away from login/signup",
        data: {
          fromPath: url.pathname,
          redirectToParam: url.searchParams.get("redirectTo"),
          resolvedRedirect: redirectUrl.pathname,
          userIdPrefix: user.id.slice(0, 8),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.redirect(redirectUrl);
  }

  // Owner-only: /dashboard
  if (user && url.pathname.startsWith("/dashboard")) {
    const { data: profile, error } = await supabase.from("profiles").select("role,has_reset_password").eq("id", user.id).maybeSingle();

    // Pending owner onboarding gate: must set password first.
    if (!error && profile?.role === "pending_owner" && !profile?.has_reset_password) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/owner/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    // Pending owners should not access dashboard yet (wait for approval).
    if (!error && profile?.role === "pending_owner") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/owner/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (error || profile?.role !== "restaurant_owner") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Admin-only: /admin
  if (user && url.pathname.startsWith("/admin")) {
    const { role: profileRole, error: profileError } = await fetchProfileRole(user.id);

    // #region agent log
    fetch("http://127.0.0.1:7334/ingest/db39d61a-a551-4eae-93f4-8f741a47f367", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3435b4" },
      body: JSON.stringify({
        sessionId: "3435b4",
        runId: "post-fix",
        hypothesisId: "A-B-D",
        location: "middleware.ts:admin-gate",
        message: "Admin middleware gate (service role)",
        data: {
          pathname: url.pathname,
          userIdPrefix: user.id.slice(0, 8),
          profileRole,
          profileError,
          willRedirectHome: Boolean(profileError || profileRole !== "admin"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (profileError || profileRole !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
      Match all request paths except for:
      - static files
      - image optimization files
      - favicon
      - next internals
      - css/js map files (dev)
      - placeholder API route (handled separately)
    */
    "/((?!_next/|favicon.ico|api/placeholder|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map)$).*)",
  ],
};

