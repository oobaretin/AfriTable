import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";

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
  return createClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

