"use client";

import * as React from "react";
import type { OpenBookingDrawerOptions } from "@/lib/booking-drawer-types";

type BookingDrawerContextType = {
  openDrawer: (options: OpenBookingDrawerOptions) => void;
  closeDrawer: () => void;
  drawerState: OpenBookingDrawerOptions | null;
  isOpen: boolean;
};

const BookingDrawerContext = React.createContext<BookingDrawerContextType | undefined>(undefined);

export function BookingDrawerProvider({ children }: { children: React.ReactNode }) {
  const [drawerState, setDrawerState] = React.useState<OpenBookingDrawerOptions | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = React.useCallback((options: OpenBookingDrawerOptions) => {
    setDrawerState(options);
    setIsOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setDrawerState(null), 300);
  }, []);

  return (
    <BookingDrawerContext.Provider value={{ openDrawer, closeDrawer, drawerState, isOpen }}>
      {children}
    </BookingDrawerContext.Provider>
  );
}

export function useBookingDrawer() {
  const context = React.useContext(BookingDrawerContext);
  if (context === undefined) {
    throw new Error("useBookingDrawer must be used within a BookingDrawerProvider");
  }
  return context;
}
