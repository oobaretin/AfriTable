"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CatalogListItem } from "@/lib/catalog-list-item";
import {
  filterByVibe,
  filterRestaurantList,
  catalogPriceLevel,
  type VibeFilterOption,
} from "@/lib/restaurant-list-filters";
import {
  buildRestaurantFilterSearchParams,
  DEFAULT_RESTAURANT_FILTERS,
  parseRestaurantFiltersFromSearchParams,
  type RestaurantFilterState,
  type RestaurantSortOption,
} from "@/lib/restaurant-filter-url";
import { filterRestaurantsByZip } from "@/lib/restaurant-zip-filter";

export type FilteredRestaurantResult = {
  restaurant: CatalogListItem;
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
  setQ: (q: string) => void;
  setPrice: (price: number | null) => void;
  setSort: (sort: RestaurantSortOption) => void;
  patchFilters: (patch: Partial<RestaurantFilterState>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
};

export function computeFilteredRestaurantResults(
  restaurants: CatalogListItem[],
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
    price: filters.price,
  });

  const results = pool.map((restaurant) => ({
    restaurant,
    distance: distanceById.get(restaurant.id) ?? null,
  }));

  const hasDistance = distanceById.size > 0;
  const effectiveSort =
    filters.sort === "distance" && !hasDistance ? "default" : filters.sort;

  switch (effectiveSort) {
    case "rating":
      results.sort((a, b) => (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0));
      break;
    case "name":
      results.sort((a, b) => a.restaurant.name.localeCompare(b.restaurant.name));
      break;
    case "price-low":
      results.sort(
        (a, b) =>
          catalogPriceLevel(a.restaurant.price_range) - catalogPriceLevel(b.restaurant.price_range),
      );
      break;
    case "price-high":
      results.sort(
        (a, b) =>
          catalogPriceLevel(b.restaurant.price_range) - catalogPriceLevel(a.restaurant.price_range),
      );
      break;
    case "distance":
      results.sort(
        (a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY),
      );
      break;
    default:
      if (hasDistance) {
        results.sort(
          (a, b) =>
            (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY),
        );
      }
      break;
  }

  return results;
}

export function useRestaurantFilters(restaurants: CatalogListItem[]): RestaurantFiltersApi {
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

  const setQ = React.useCallback(
    (q: string) => patchFilters({ q: q.trim() }),
    [patchFilters],
  );

  const setPrice = React.useCallback(
    (price: number | null) => patchFilters({ price }),
    [patchFilters],
  );

  const setSort = React.useCallback(
    (sort: RestaurantSortOption) => patchFilters({ sort }),
    [patchFilters],
  );

  const clearFilters = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters =
    Boolean(filters.city) ||
    filters.cuisine !== "All" ||
    filters.zip.length === 5 ||
    filters.vibe !== "All" ||
    filters.price != null ||
    filters.sort !== "default" ||
    Boolean(filters.q);

  return {
    filters,
    filteredResults,
    zipSearchActive,
    setCity,
    setCuisine,
    setZip,
    setRadius,
    setVibe,
    setQ,
    setPrice,
    setSort,
    patchFilters,
    clearFilters,
    hasActiveFilters,
  };
}

export { DEFAULT_RESTAURANT_FILTERS };
