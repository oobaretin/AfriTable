import { NextResponse } from "next/server";
import { appendFileSync } from "node:fs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfileRole } from "@/lib/supabase/service-client";

const LOG_PATH = "/Users/osagieobaretin/AfriTable/.cursor/debug-3435b4.log";

function writeLog(payload: Record<string, unknown>) {
  try {
    appendFileSync(LOG_PATH, `${JSON.stringify({ sessionId: "3435b4", timestamp: Date.now(), ...payload })}\n`);
  } catch {
    // ignore if log path unavailable (e.g. Vercel)
  }
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const user = auth.user;

  let profileRole: string | null = null;
  let profileError: string | null = null;

  if (user) {
    const { role, error } = await fetchProfileRole(user.id);
    profileRole = role;
    profileError = error;
  }

  const result = {
    hasUser: Boolean(user),
    userIdPrefix: user?.id?.slice(0, 8) ?? null,
    profileRole,
    profileError,
    authError: authError?.message ?? null,
    wouldAllowAdmin: profileRole === "admin",
  };

  writeLog({
    runId: "pre-fix",
    hypothesisId: "A-B",
    location: "api/debug/admin-gate",
    message: "Admin gate diagnostic",
    data: result,
  });

  return NextResponse.json(result);
}
