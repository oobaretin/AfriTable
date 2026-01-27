"use client";

import * as React from "react";
import type { RestaurantRow } from "@/components/restaurant/RestaurantCard";

type BookingDrawerContextType = {
  openDrawer: (restaurant: RestaurantRow) => void;
  closeDrawer: () => void;
  restaurant: RestaurantRow | null;
  isOpen: boolean;
};

const BookingDrawerContext = React.createContext<BookingDrawerContextType | undefined>(undefined);

export function BookingDrawerProvider({ children }: { children: React.ReactNode }) {
  const [restaurant, setRestaurant] = React.useState<RestaurantRow | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = React.useCallback((rest: RestaurantRow) => {
    setRestaurant(rest);
    setIsOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsOpen(false);
    // Clear restaurant after animation completes
    setTimeout(() => setRestaurant(null), 300);
  }, []);

  return (
    <BookingDrawerContext.Provider value={{ openDrawer, closeDrawer, restaurant, isOpen }}>
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
