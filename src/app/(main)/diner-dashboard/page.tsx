import { requireAuth } from "@/lib/auth/utils";
import { DinerDashboard } from "@/components/dashboard/DinerDashboard";

export default async function DinerDashboardPage() {
  await requireAuth("/login?redirectTo=/diner-dashboard");
  return <DinerDashboard />;
}
