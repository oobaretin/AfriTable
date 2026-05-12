/**
 * Lightweight Supabase JWT shape validator.
 *
 * Purpose: fail loudly at client construction time when an env var like
 * NEXT_PUBLIC_SUPABASE_ANON_KEY has been mis-pasted or rearranged. A typical
 * symptom is a leading "." or the JWT header chunk landing inside the signature,
 * which Supabase returns as an opaque "Invalid API key" 401 at every request.
 *
 * This does NOT validate the cryptographic signature — that's Supabase's job.
 * It only catches structural corruption so we surface the real cause early.
 */

type ExpectedRole = "anon" | "service_role";

function b64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }
  return Buffer.from(padded, "base64").toString("utf8");
}

function tryParseJsonSegment(seg: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(b64urlDecode(seg));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Throws a descriptive `Error` if `key` is not a well-formed Supabase JWT
 * for `expectedRole`. Returns void on success.
 *
 * @param key          Raw env var value
 * @param envVarName   Used in error messages so the operator knows which var to fix
 * @param expectedRole "anon" for public/browser clients, "service_role" for admin
 */
export function assertSupabaseJwtShape(key: string, envVarName: string, expectedRole: ExpectedRole): void {
  if (!key || typeof key !== "string") {
    throw new Error(`${envVarName} is empty or not a string. Set it to the JWT shown in Supabase Dashboard → Settings → API.`);
  }
  const parts = key.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `${envVarName} is malformed: a JWT must have exactly 3 dot-separated parts (header.payload.signature), got ${parts.length}. ` +
        `Check the value in your env file — a stray "." or missing chunk is the usual cause.`,
    );
  }
  if (parts[0].length === 0) {
    throw new Error(
      `${envVarName} starts with "." — its JWT header chunk is missing. ` +
        `Re-copy the key from Supabase Dashboard → Settings → API (do not edit by hand).`,
    );
  }
  const header = tryParseJsonSegment(parts[0]);
  if (!header || typeof header.alg !== "string") {
    throw new Error(
      `${envVarName} has an unreadable JWT header. The header chunk may have been re-ordered or truncated. ` +
        `Re-copy the key from Supabase Dashboard → Settings → API.`,
    );
  }
  const payload = tryParseJsonSegment(parts[1]);
  if (!payload) {
    throw new Error(`${envVarName} has an unreadable JWT payload (not base64-decodable JSON).`);
  }
  if (payload.role !== expectedRole) {
    throw new Error(
      `${envVarName} has role="${String(payload.role)}", expected "${expectedRole}". ` +
        `You may have swapped your anon and service_role keys.`,
    );
  }
}
