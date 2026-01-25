import { requireAuth } from "@/lib/auth/utils";
import { MyReservationsClient } from "@/components/reservation/MyReservationsClient";

export default async function ReservationsPage() {
  await requireAuth("/login?redirectTo=/reservations");
  return <MyReservationsClient />;
}

