import { Suspense } from "react";
import { BookingCheckoutClient } from "@/components/reservation/BookingCheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-paper flex items-center justify-center">Loading...</div>}>
      <BookingCheckoutClient />
    </Suspense>
  );
}
