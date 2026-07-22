import { createClient } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";

/** Service-role client safe for Edge middleware (no next/headers). */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL or service role key");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function fetchProfileRole(userId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return { role: data?.role ?? null, error: error?.message ?? null };
}
