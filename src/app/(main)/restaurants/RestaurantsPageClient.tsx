"use client";

import * as React from "react";
import { RestaurantsPageSearch } from "@/components/restaurants/RestaurantsPageSearch";
import { RestaurantsGridClient } from "./RestaurantsGridClient";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type RestaurantsPageClientProps = {
  restaurants: JSONRestaurant[];
};

export function RestaurantsPageClient({ restaurants }: RestaurantsPageClientProps) {
  // Hold the current list from search (vibe-filtered; may include distance when zip is entered)
  const [filteredRestaurants, setFilteredRestaurants] = React.useState<RestaurantWithDistance[]>(
    () => restaurants.map((r) => ({ restaurant: r, distance: null }))
  );

  const handleFilterChange = React.useCallback((filtered: RestaurantWithDistance[]) => {
    setFilteredRestaurants(filtered);
  }, []);

  const restaurantsForGrid = filteredRestaurants.map((r) => r.restaurant);

  const distanceById = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of filteredRestaurants) {
      if (item.distance != null) {
        map.set(item.restaurant.id, item.distance);
      }
    }
    return map;
  }, [filteredRestaurants]);

  return (
    <>
      {/* Zip Code Search and Vibe Filter Section */}
      <RestaurantsPageSearch 
        restaurants={restaurants} 
        onFilterChange={handleFilterChange}
      />

      <RestaurantsGridClient
        restaurants={restaurantsForGrid}
        distanceById={distanceById}
      />
    </>
  );
}
