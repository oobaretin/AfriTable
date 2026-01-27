"use client";

import { BookingDrawer } from "./BookingDrawer";
import { useBookingDrawer } from "@/contexts/BookingDrawerContext";

export function BookingDrawerWrapper() {
  const { restaurant, isOpen, closeDrawer } = useBookingDrawer();
  return <BookingDrawer restaurant={restaurant} isOpen={isOpen} onClose={closeDrawer} />;
}
