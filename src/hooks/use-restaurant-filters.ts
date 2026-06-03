"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";
import {
  filterByVibe,
  filterRestaurantList,
  type VibeFilterOption,
} from "@/lib/restaurant-list-filters";
import {
  buildRestaurantFilterSearchParams,
  DEFAULT_RESTAURANT_FILTERS,
  parseRestaurantFiltersFromSearchParams,
  type RestaurantFilterState,
} from "@/lib/restaurant-filter-url";
import { filterRestaurantsByZip } from "@/lib/restaurant-zip-filter";

export type FilteredRestaurantResult = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

export type RestaurantFiltersApi = {
  filters: RestaurantFilterState;
  filteredResults: FilteredRestaurantResult[];
  zipSearchActive: boolean;
  setCity: (city: string) => void;
  setCuisine: (cuisine: string) => void;
  setZip: (zip: string) => void;
  setRadius: (radius: number) => void;
  setVibe: (vibe: VibeFilterOption) => void;
  patchFilters: (patch: Partial<RestaurantFilterState>) => void;
  clearFilters: () => void;
};

export function computeFilteredRestaurantResults(
  restaurants: JSONRestaurant[],
  filters: RestaurantFilterState,
): FilteredRestaurantResult[] {
  let pool = restaurants;
  const distanceById = new Map<string, number>();

  if (filters.zip.length === 5) {
    const zipMatches = filterRestaurantsByZip(restaurants, filters.zip, filters.radius);
    pool = zipMatches.map((item) => item.restaurant);
    for (const item of zipMatches) {
      distanceById.set(item.restaurant.id, item.distance);
    }
  }

  pool = filterByVibe(pool, filters.vibe);

  pool = filterRestaurantList(pool, {
    activeCategory: filters.cuisine,
    activeCity: filters.city,
    nameQuery: filters.q.toLowerCase(),
  });

  const results = pool.map((restaurant) => ({
    restaurant,
    distance: distanceById.get(restaurant.id) ?? null,
  }));

  if (distanceById.size > 0) {
    results.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
  }

  return results;
}

export function useRestaurantFilters(restaurants: JSONRestaurant[]): RestaurantFiltersApi {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(
    () => parseRestaurantFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const filteredResults = React.useMemo(
    () => computeFilteredRestaurantResults(restaurants, filters),
    [restaurants, filters],
  );

  const zipSearchActive = filters.zip.length === 5;

  const patchFilters = React.useCallback(
    (patch: Partial<RestaurantFilterState>) => {
      const next: RestaurantFilterState = {
        ...filters,
        ...patch,
      };

      if (patch.zip !== undefined) {
        next.zip = patch.zip.replace(/\D/g, "").slice(0, 5);
      }

      const params = buildRestaurantFilterSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const setCity = React.useCallback(
    (city: string) => patchFilters({ city }),
    [patchFilters],
  );

  const setCuisine = React.useCallback(
    (cuisine: string) => patchFilters({ cuisine: cuisine || "All" }),
    [patchFilters],
  );

  const setZip = React.useCallback(
    (zip: string) => patchFilters({ zip }),
    [patchFilters],
  );

  const setRadius = React.useCallback(
    (radius: number) => patchFilters({ radius }),
    [patchFilters],
  );

  const setVibe = React.useCallback(
    (vibe: VibeFilterOption) => patchFilters({ vibe }),
    [patchFilters],
  );

  const clearFilters = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    filters,
    filteredResults,
    zipSearchActive,
    setCity,
    setCuisine,
    setZip,
    setRadius,
    setVibe,
    patchFilters,
    clearFilters,
  };
}

export { DEFAULT_RESTAURANT_FILTERS };
