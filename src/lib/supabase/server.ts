import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";
import { assertSupabaseJwtShape } from "./validate-jwt";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/**
 * Supabase client for Server Components and Route Handlers.
 *
 * Uses the **anon** key + cookies for auth/SSR. (Service role is provided via `createSupabaseAdminClient`.)
 */
export function createSupabaseServerClient(): SupabaseClient<Database> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assertSupabaseJwtShape(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components, `cookies()` can be read-only and `.set()` throws.
        // Route handlers and middleware support setting cookies.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // no-op
        }
      },
    },
  });
}

/**
 * Supabase client for Route Handlers that redirect (e.g. OAuth callback).
 * Session cookies must be written onto the redirect response, not only cookies().
 */
export function createSupabaseRouteHandlerClient(response: NextResponse): SupabaseClient<Database> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assertSupabaseJwtShape(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Server Components may be read-only; response cookies still apply.
          }
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Supabase Admin client for server-side privileged operations.
 *
 * IMPORTANT: Never expose the service role key to the browser.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  assertSupabaseJwtShape(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY", "service_role");

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

