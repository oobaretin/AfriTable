"use client";

import * as React from "react";
import { RestaurantResults } from "./RestaurantResults";
import { ZipCodeSearch } from "./ZipCodeSearch";
import { VibeFilter } from "./VibeFilter";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type VibeOption = "All" | "Fine Dining" | "Authentic Staples" | "Daily Driver";

type HomepageRestaurantClientProps = {
  restaurants: JSONRestaurant[];
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

export function HomepageRestaurantClient({ restaurants }: HomepageRestaurantClientProps) {
  const [selectedVibe, setSelectedVibe] = React.useState<VibeOption>("All");
  const [distanceFilteredRestaurants, setDistanceFilteredRestaurants] = React.useState<RestaurantWithDistance[]>(
    restaurants.map((r) => ({ restaurant: r, distance: null }))
  );

  // Apply vibe filter to distance-filtered restaurants
  const filteredRestaurants = React.useMemo(() => {
    return filterByVibe(distanceFilteredRestaurants, selectedVibe);
  }, [distanceFilteredRestaurants, selectedVibe]);

  const handleFilterChange = (filtered: RestaurantWithDistance[]) => {
    setDistanceFilteredRestaurants(filtered);
  };

  const handleVibeChange = (vibe: VibeOption) => {
    setSelectedVibe(vibe);
  };

  return (
    <>
      {/* Zip Code Search Bar */}
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
            onFilterChange={handleFilterChange}
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

      {/* Restaurant Results */}
      <RestaurantResults restaurants={filteredRestaurants} />
    </>
  );
}
