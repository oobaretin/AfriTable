import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/");

  const userName =
    profile.full_name ??
    (typeof auth.user.user_metadata?.name === "string" ? auth.user.user_metadata.name : null) ??
    auth.user.email ??
    "Admin";

  return <AdminDashboardLayout userName={userName}>{children}</AdminDashboardLayout>;
}
