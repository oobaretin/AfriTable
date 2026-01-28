"use client";

import * as React from "react";
import { RestaurantsPageSearch } from "@/components/restaurants/RestaurantsPageSearch";
import { RestaurantsGridClient } from "./RestaurantsGridClient";
import { RestaurantResults } from "@/components/home/RestaurantResults";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type RestaurantsPageClientProps = {
  restaurants: JSONRestaurant[];
};

export function RestaurantsPageClient({ restaurants }: RestaurantsPageClientProps) {
  const [filteredRestaurants, setFilteredRestaurants] = React.useState<RestaurantWithDistance[] | null>(null);
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  const handleFilterChange = React.useCallback((filtered: RestaurantWithDistance[]) => {
    // Check if search is active (has distance data, meaning zip code was entered)
    // Only consider it a search if at least one restaurant has a non-null distance
    const hasSearch = filtered.some((r) => r.distance !== null);
    
    // Don't trigger search mode on initial load (when all distances are null)
    if (!hasInitialized && !hasSearch) {
      setHasInitialized(true);
      return; // Skip the first call with all null distances
    }
    
    setHasInitialized(true);
    setIsSearchActive(hasSearch);
    if (hasSearch) {
      setFilteredRestaurants(filtered);
    } else {
      // Reset to null when search is cleared
      setFilteredRestaurants(null);
    }
  }, [hasInitialized]);

  return (
    <>
      {/* Zip Code Search and Vibe Filter Section */}
      <RestaurantsPageSearch 
        restaurants={restaurants} 
        onFilterChange={handleFilterChange}
      />

      {/* Show search results if search is active, otherwise show regular grid */}
      {isSearchActive && filteredRestaurants ? (
        <RestaurantResults restaurants={filteredRestaurants} />
      ) : (
        <RestaurantsGridClient restaurants={restaurants} />
      )}
    </>
  );
}
