import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@db/database.types";
import { sanitizeRedirectPath } from "@/lib/auth/config";

const ADMIN_HOME = "/admin";
const DINER_LANDING_PATHS = new Set(["/", "/reservations", "/profile", "/favorites"]);

export function resolvePostLoginPathForRole(
  role: string | null | undefined,
  redirectTo: string | null | undefined,
): string {
  const safeRedirect = sanitizeRedirectPath(redirectTo);

  if (role === "admin") {
    if (safeRedirect === ADMIN_HOME || safeRedirect.startsWith(`${ADMIN_HOME}/`)) {
      return safeRedirect;
    }
    if (DINER_LANDING_PATHS.has(safeRedirect)) {
      return ADMIN_HOME;
    }
  }

  return safeRedirect;
}

/**
 * After sign-in, send admins to /admin when they would otherwise land on diner pages.
 */
export async function resolvePostLoginPath(
  supabase: SupabaseClient<Database>,
  redirectTo: string | null | undefined,
): Promise<string> {
  const safeRedirect = sanitizeRedirectPath(redirectTo);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeRedirect;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return resolvePostLoginPathForRole(profile?.role, safeRedirect);
}
