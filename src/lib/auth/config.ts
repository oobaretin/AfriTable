/** Google OAuth is enabled when this flag is true and Supabase Google provider is configured. */
export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";
}

export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Build OAuth / email redirect URL (must be allowlisted in Supabase Auth settings). */
export function buildAuthCallbackUrl(origin: string, nextPath = "/"): string {
  const safeNext = sanitizeRedirectPath(nextPath);
  const url = new URL(AUTH_CALLBACK_PATH, origin);
  url.searchParams.set("next", safeNext);
  return url.toString();
}

/** Only allow same-origin relative redirects (prevents open redirects). */
export function sanitizeRedirectPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_oauth_code: "Sign-in was cancelled or the link was invalid. Please try again.",
  oauth_start_failed: "Could not start Google sign-in. Try again or use email/password.",
  oauth_exchange_failed: "Could not complete sign-in with Google. Check Supabase Google provider settings and try again.",
  access_denied: "Google sign-in was cancelled.",
};

export function resolveAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.";
}
