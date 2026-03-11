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
  // Hold the current list from search (vibe-filtered; may include distance when zip is entered)
  const [filteredRestaurants, setFilteredRestaurants] = React.useState<RestaurantWithDistance[]>(
    () => restaurants.map((r) => ({ restaurant: r, distance: null }))
  );

  const handleFilterChange = React.useCallback((filtered: RestaurantWithDistance[]) => {
    setFilteredRestaurants(filtered);
  }, []);

  const isSearchActive = filteredRestaurants.length > 0 && filteredRestaurants.some((r) => r.distance !== null);
  const restaurantsForGrid = filteredRestaurants.map((r) => r.restaurant);

  return (
    <>
      {/* Zip Code Search and Vibe Filter Section */}
      <RestaurantsPageSearch 
        restaurants={restaurants} 
        onFilterChange={handleFilterChange}
      />

      {/* Zip search with distances: show results list; otherwise show grid with vibe-filtered restaurants */}
      {isSearchActive ? (
        <RestaurantResults restaurants={filteredRestaurants} />
      ) : (
        <RestaurantsGridClient restaurants={restaurantsForGrid} />
      )}
    </>
  );
}
