import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";
import { assertSupabaseJwtShape } from "./validate-jwt";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

/**
 * Public server-side Supabase client (no cookies/session).
 * Useful for SEO routes like sitemap/robots and cached public data fetching.
 */
export function createSupabasePublicClient(): SupabaseClient<Database> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assertSupabaseJwtShape(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'apikey': anonKey,
          },
        });
      },
    },
  });
}

