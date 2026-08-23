"use client";

import * as React from "react";
import Link from "next/link";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { NoResultsFound } from "@/components/search/NoResultsFound";
import { transformJSONRestaurantToDetail } from "@/lib/restaurant-json-loader";
import type { FilteredRestaurantResult } from "@/hooks/use-restaurant-filters";
import { useRestaurantFiltersContext } from "@/contexts/restaurant-filters-context";
import { buildRestaurantsDirectoryHref } from "@/lib/restaurant-filter-url";
import { useLivePartnerSlugs, isLivePartnerSlug } from "@/contexts/live-partner-slugs-context";
import { resolveBookingAction } from "@/lib/booking-action";

type RestaurantGridProps = {
  filteredResults: FilteredRestaurantResult[];
  onCountChange?: (count: number, total: number) => void;
};

const ITEMS_PER_PAGE = 12;

export function RestaurantGrid({ filteredResults, onCountChange }: RestaurantGridProps) {
  const { zipSearchActive, filters } = useRestaurantFiltersContext();
  const livePartnerSlugs = useLivePartnerSlugs();
  const [displayCount, setDisplayCount] = React.useState<number>(ITEMS_PER_PAGE);

  React.useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [filteredResults.length, zipSearchActive]);

  const transformedRestaurants = React.useMemo(() => {
    return filteredResults.map((item) => ({
      ...transformJSONRestaurantToDetail(item.restaurant),
      distance_miles: item.distance,
    }));
  }, [filteredResults]);

  const displayedRestaurants = React.useMemo(() => {
    return transformedRestaurants.slice(0, displayCount);
  }, [transformedRestaurants, displayCount]);

  React.useEffect(() => {
    onCountChange?.(displayedRestaurants.length, transformedRestaurants.length);
  }, [displayedRestaurants.length, transformedRestaurants.length, onCountChange]);

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, transformedRestaurants.length));
  };

  const hasMore = displayedRestaurants.length < transformedRestaurants.length;
  const hasResults = transformedRestaurants.length > 0;

  return (
    <div className="w-full min-h-[100vh] flex flex-col">
      {zipSearchActive && (
        <div className="mb-8 text-center">
          <h2 className="text-xl md:text-2xl font-serif text-[#C69C2B] font-normal mb-1">
            Restaurants near you
          </h2>
          <p className="text-sm text-white/60">
            {transformedRestaurants.length}{" "}
            {transformedRestaurants.length === 1 ? "restaurant" : "restaurants"} sorted by distance
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {hasResults ? (
          displayedRestaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="animate-in fade-in duration-500"
              style={{
                animationDelay: `${Math.min(index % ITEMS_PER_PAGE, 5) * 50}ms`,
              }}
            >
              <RestaurantCard
                restaurant={restaurant}
                href={`/restaurants/${encodeURIComponent(restaurant.id || restaurant.slug)}`}
                index={index}
                bookingAction={resolveBookingAction(
                  isLivePartnerSlug(restaurant.slug || restaurant.id, livePartnerSlugs)
                    ? {
                        isLivePartner: true,
                        isClaimed: true,
                        onlineReservationsEnabled: true,
                      }
                    : { isLivePartner: false, isClaimed: false, onlineReservationsEnabled: false },
                  { phone: restaurant.phone },
                )}
              />
            </div>
          ))
        ) : filters.city ? (
          <div className="col-span-full">
            <NoResultsFound
              searchedCity={filters.city}
              searchedCuisine={filters.cuisine !== "All" ? filters.cuisine : undefined}
            />
          </div>
        ) : (
          <div className="col-span-full">
            <NoResultsFound
              searchedCuisine={filters.cuisine !== "All" ? filters.cuisine : undefined}
            />
            <div className="mt-6 text-center">
              <Link
                href={buildRestaurantsDirectoryHref()}
                className="inline-flex rounded-full border border-[#C69C2B] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#C69C2B] transition-colors hover:bg-[#C69C2B]/10"
              >
                Browse all restaurants
              </Link>
            </div>
          </div>
        )}
      </div>

      {hasResults && hasMore && (
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLoadMore}
            className="group relative bg-transparent hover:bg-[#C69C2B]/10 border border-[#C69C2B] text-[#C69C2B] text-sm font-bold px-8 py-4 rounded-full uppercase tracking-widest transition-all duration-500 hover:shadow-[0_0_15px_rgba(198,156,43,0.4)]"
          >
            Load More
            <span className="ml-2 inline-block transition-transform duration-500 group-hover:translate-y-1">
              ↓
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
