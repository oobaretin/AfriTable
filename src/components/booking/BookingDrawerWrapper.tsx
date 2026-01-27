"use client";

import { BookingModal } from "./BookingModal";
import { useBookingDrawer } from "@/contexts/BookingDrawerContext";

export function BookingDrawerWrapper() {
  const { isOpen, closeDrawer, restaurant } = useBookingDrawer();
  return <BookingModal isOpen={isOpen} onClose={closeDrawer} restaurant={restaurant} />;
}
