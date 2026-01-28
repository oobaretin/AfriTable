"use client";

import * as React from "react";
import { ZipCodeSearch } from "@/components/home/ZipCodeSearch";
import { VibeFilter } from "@/components/home/VibeFilter";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type VibeOption = "All" | "Fine Dining" | "Authentic Staples" | "Daily Driver";

type RestaurantsPageSearchProps = {
  restaurants: JSONRestaurant[];
  onFilterChange: (filtered: RestaurantWithDistance[]) => void;
};

// Filter restaurants by vibe
function filterByVibe(
  restaurants: RestaurantWithDistance[],
  vibe: VibeOption
): RestaurantWithDistance[] {
  if (vibe === "All") {
    return restaurants;
  }

  return restaurants.filter((item) => {
    const restaurant = item.restaurant;
    
    // Check vibe_category first
    if (vibe === "Fine Dining" && restaurant.vibe_category === "Fine Dining") {
      return true;
    }
    if (vibe === "Authentic Staples" && restaurant.vibe_category === "Authentic Staples") {
      return true;
    }
    
    // Check vibe field for "Daily Driver"
    if (vibe === "Daily Driver") {
      const restaurantVibe = restaurant.vibe?.toLowerCase() || "";
      return restaurantVibe.includes("daily driver");
    }
    
    return false;
  });
}

export function RestaurantsPageSearch({ restaurants, onFilterChange }: RestaurantsPageSearchProps) {
  const [selectedVibe, setSelectedVibe] = React.useState<VibeOption>("All");
  const [distanceFilteredRestaurants, setDistanceFilteredRestaurants] = React.useState<RestaurantWithDistance[]>(
    restaurants.map((r) => ({ restaurant: r, distance: null }))
  );

  // Apply vibe filter to distance-filtered restaurants
  const filteredRestaurants = React.useMemo(() => {
    return filterByVibe(distanceFilteredRestaurants, selectedVibe);
  }, [distanceFilteredRestaurants, selectedVibe]);

  // Notify parent when filters change - only when there's an actual search (distance !== null)
  React.useEffect(() => {
    // Only notify if there's an actual search (at least one restaurant has distance)
    const hasSearch = filteredRestaurants.some((r) => r.distance !== null);
    if (hasSearch) {
      onFilterChange(filteredRestaurants);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRestaurants]);

  const handleDistanceFilterChange = (filtered: RestaurantWithDistance[]) => {
    setDistanceFilteredRestaurants(filtered);
  };

  const handleVibeChange = (vibe: VibeOption) => {
    setSelectedVibe(vibe);
  };

  return (
    <section className="py-12 bg-[#050A18] px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-serif text-[#C69C2B] font-normal mb-2">
            Find Restaurants Near You
          </h2>
          <p className="text-sm text-white/60">
            Enter your zip code to discover authentic African & Caribbean dining
          </p>
        </div>
        <ZipCodeSearch 
          restaurants={restaurants} 
          onFilterChange={handleDistanceFilterChange}
        />
        
        {/* Vibe Filter */}
        <div className="mt-8">
          <div className="text-center mb-4">
            <p className="text-sm text-white/60 mb-3">Filter by vibe</p>
          </div>
          <VibeFilter selectedVibe={selectedVibe} onVibeChange={handleVibeChange} />
        </div>
      </div>
    </section>
  );
}
