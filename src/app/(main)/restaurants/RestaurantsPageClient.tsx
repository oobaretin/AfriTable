"use client";

import * as React from "react";
import { Suspense } from "react";
import { RestaurantFiltersProvider } from "@/contexts/restaurant-filters-context";
import { RestaurantsGridClient } from "./RestaurantsGridClient";
import type { CatalogListItem } from "@/lib/catalog-list-item";

type RestaurantsPageClientProps = {
  restaurants: CatalogListItem[];
};

function RestaurantsPageContent({ restaurants }: RestaurantsPageClientProps) {
  return (
    <RestaurantFiltersProvider restaurants={restaurants}>
      <RestaurantsGridClient />
    </RestaurantFiltersProvider>
  );
}

export function RestaurantsPageClient({ restaurants }: RestaurantsPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-sm uppercase tracking-widest text-white/50">
          Loading restaurants…
        </div>
      }
    >
      <RestaurantsPageContent restaurants={restaurants} />
    </Suspense>
  );
}
