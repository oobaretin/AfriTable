import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "@db/database.types";
import { assertSupabaseJwtShape } from "@/lib/supabase/validate-jwt";
import { buildAuthCallbackUrl, sanitizeRedirectPath } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** Start Google OAuth server-side so the PKCE verifier cookie is set before redirect. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = sanitizeRedirectPath(searchParams.get("next"));
  const loginErrorUrl = new URL("/login", origin);

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assertSupabaseJwtShape(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

  const callbackUrl = buildAuthCallbackUrl(origin, next);
  const cookieStore = cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const merged: CookieOptions = {
            ...options,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
            ...(isProduction ? { secure: true } : {}),
          };
          pendingCookies.push({ name, value, options: merged });
          try {
            cookieStore.set(name, value, merged);
          } catch {
            // read-only in some contexts
          }
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "online",
        prompt: "select_account",
      },
      scopes: "email profile",
    },
  });

  if (error || !data.url) {
    loginErrorUrl.searchParams.set("error", "oauth_start_failed");
    return NextResponse.redirect(loginErrorUrl);
  }

  const response = NextResponse.redirect(data.url);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
