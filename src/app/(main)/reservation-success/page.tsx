import { Suspense } from "react";
import { ReservationSuccessClient } from "@/components/reservation/ReservationSuccessClient";

export default function ReservationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-paper flex items-center justify-center">Loading...</div>}>
      <ReservationSuccessClient />
    </Suspense>
  );
}
