"use client";

import * as React from "react";
import { Suspense } from "react";
import { RestaurantFiltersProvider } from "@/contexts/restaurant-filters-context";
import { LivePartnerSlugsProvider } from "@/contexts/live-partner-slugs-context";
import { CategoryFilterWrapper } from "@/components/home/CategoryFilterWrapper";
import type { CatalogListItem } from "@/lib/catalog-list-item";

type RestaurantsPageClientProps = {
  restaurants: CatalogListItem[];
  livePartnerSlugs?: string[];
};

function RestaurantsPageContent({ restaurants }: { restaurants: CatalogListItem[] }) {
  return (
    <RestaurantFiltersProvider restaurants={restaurants}>
      <CategoryFilterWrapper />
    </RestaurantFiltersProvider>
  );
}

export function RestaurantsPageClient({ restaurants, livePartnerSlugs = [] }: RestaurantsPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-sm uppercase tracking-widest text-white/50">
          Loading restaurants…
        </div>
      }
    >
      <LivePartnerSlugsProvider slugs={livePartnerSlugs}>
        <RestaurantsPageContent restaurants={restaurants} />
      </LivePartnerSlugsProvider>
    </Suspense>
  );
}
