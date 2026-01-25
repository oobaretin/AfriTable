import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  // IMPORTANT: In Client Components, env vars must be referenced with static keys
  // so Next can inline them at build time. Avoid `process.env[name]`.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createBrowserClient<Database>(url, anonKey);
}

