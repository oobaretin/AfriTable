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

  const handleFilterChange = (filtered: RestaurantWithDistance[]) => {
    // Check if search is active (has distance data or vibe filter applied)
    const hasSearch = filtered.length > 0 && filtered[0].distance !== null;
    setIsSearchActive(hasSearch);
    setFilteredRestaurants(hasSearch ? filtered : null);
  };

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
