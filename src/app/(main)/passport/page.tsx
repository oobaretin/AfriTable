import { requireAuth } from "@/lib/auth/utils";
import { CulinaryPassport } from "@/components/dashboard/CulinaryPassport";

export default async function PassportPage() {
  await requireAuth("/login?redirectTo=/passport");
  return <CulinaryPassport />;
}
