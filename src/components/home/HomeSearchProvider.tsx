"use client";

import * as React from "react";
import { HeroSearchCityProvider } from "@/components/restaurant/HeroSearchCityContext";
import { StickySearch } from "@/components/home/StickySearch";

/** Shares Find Table city state between the hero and sticky search bars on the homepage. */
export function HomeSearchProvider({ children }: { children: React.ReactNode }) {
  return (
    <HeroSearchCityProvider>
      <StickySearch />
      {children}
    </HeroSearchCityProvider>
  );
}
