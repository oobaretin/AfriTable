import { getUser, getUserProfile } from "@/lib/auth/utils";
import { NavbarClient } from "./NavbarClient";

export default async function Navbar() {
  const user = await getUser();
  const profile = user ? await getUserProfile() : null;

  return <NavbarClient user={user} profile={profile} />;
}

