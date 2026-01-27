import { requireAuth } from "@/lib/auth/utils";
import { CulinaryPassport } from "@/components/dashboard/CulinaryPassport";
import { EventChallenge } from "@/components/dashboard/EventChallenge";

export default async function PassportPage() {
  await requireAuth("/login?redirectTo=/passport");
  return (
    <>
      <EventChallenge />
      <CulinaryPassport />
    </>
  );
}
