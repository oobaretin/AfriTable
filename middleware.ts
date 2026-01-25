import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Create a response we can attach refreshed auth cookies to.
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
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

  // Owner-only: /dashboard
  if (user && url.pathname.startsWith("/dashboard")) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || profile?.role !== "restaurant_owner") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Admin-only: /admin
  if (user && url.pathname.startsWith("/admin")) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || profile?.role !== "admin") {
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
    */
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map)$).*)",
  ],
};

