"use client";

import * as React from "react";
import type { CatalogListItem } from "@/lib/catalog-list-item";
import {
  useRestaurantFilters,
  type RestaurantFiltersApi,
} from "@/hooks/use-restaurant-filters";

const RestaurantFiltersContext = React.createContext<RestaurantFiltersApi | null>(null);

export function RestaurantFiltersProvider({
  restaurants,
  children,
}: {
  restaurants: CatalogListItem[];
  children: React.ReactNode;
}) {
  const api = useRestaurantFilters(restaurants);

  return (
    <RestaurantFiltersContext.Provider value={api}>{children}</RestaurantFiltersContext.Provider>
  );
}

export function useRestaurantFiltersContext(): RestaurantFiltersApi {
  const ctx = React.useContext(RestaurantFiltersContext);
  if (!ctx) {
    throw new Error("useRestaurantFiltersContext must be used within RestaurantFiltersProvider");
  }
  return ctx;
}
