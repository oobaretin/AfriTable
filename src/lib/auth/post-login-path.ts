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
