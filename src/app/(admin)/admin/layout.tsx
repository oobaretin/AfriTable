import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfileRole } from "@/lib/supabase/service-client";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";

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
  if (profileRole !== "admin") redirect("/");

  const { data: selfProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  const userName =
    selfProfile?.full_name ??
    (typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : null) ??
    auth.user.email ??
    "Admin";

  return <AdminDashboardLayout userName={userName}>{children}</AdminDashboardLayout>;
}
