import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";
import { buildAuthCallbackUrl } from "@/lib/auth/config";

/**
 * Start Google OAuth. New users default to `diner` via the handle_new_user DB trigger.
 * Restaurant owners should use /restaurant-signup with email/password.
 */
export async function signInWithGoogle(
  supabase: SupabaseClient<Database>,
  options: { origin: string; redirectTo?: string } = { origin: "", redirectTo: "/" },
): Promise<{ error: Error | null }> {
  const { origin, redirectTo = "/" } = options;

  const callbackUrl = buildAuthCallbackUrl(origin, redirectTo);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "online",
        prompt: "select_account",
      },
      scopes: "email profile",
    },
  });

  return { error: error ? new Error(error.message) : null };
}
