"use client";

import { BookingDrawer } from "./BookingDrawer";
import { useBookingDrawer } from "@/contexts/BookingDrawerContext";

export function BookingDrawerWrapper() {
  const { isOpen, closeDrawer, drawerState } = useBookingDrawer();
  return <BookingDrawer isOpen={isOpen} onClose={closeDrawer} drawerState={drawerState} />;
}
