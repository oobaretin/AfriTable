import { requireAuth } from "@/lib/auth/utils";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  await requireAuth("/login?redirectTo=/profile");
  return <ProfileClient />;
}

