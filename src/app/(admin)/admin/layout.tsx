import { redirect } from "next/navigation";
import { appendFileSync } from "node:fs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfileRole } from "@/lib/supabase/service-client";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";

const LOG_PATH = "/Users/osagieobaretin/AfriTable/.cursor/debug-3435b4.log";

function writeLog(payload: Record<string, unknown>) {
  try {
    appendFileSync(LOG_PATH, `${JSON.stringify({ sessionId: "3435b4", timestamp: Date.now(), ...payload })}\n`);
  } catch {
    // ignore on Vercel
  }
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · AfriTable Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/admin");

  const { role: profileRole } = await fetchProfileRole(auth.user.id);

  const { data: selfProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  // #region agent log
  writeLog({
    runId: "post-fix",
    hypothesisId: "A-B",
    location: "admin/layout.tsx:role-check",
    message: "Admin layout role check (service role)",
    data: {
      userIdPrefix: auth.user.id.slice(0, 8),
      profileRole,
      willRedirectHome: profileRole !== "admin",
    },
  });
  // #endregion
  if (profileRole !== "admin") redirect("/");

  const userName =
    selfProfile?.full_name ??
    (typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : null) ??
    auth.user.email ??
    "Admin";

  return <AdminDashboardLayout userName={userName}>{children}</AdminDashboardLayout>;
}
