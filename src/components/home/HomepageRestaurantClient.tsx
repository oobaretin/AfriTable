"use client";

import * as React from "react";
import { RestaurantResults } from "./RestaurantResults";
import { ZipCodeSearch } from "./ZipCodeSearch";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type HomepageRestaurantClientProps = {
  restaurants: JSONRestaurant[];
};

export function HomepageRestaurantClient({ restaurants }: HomepageRestaurantClientProps) {
  const [filteredRestaurants, setFilteredRestaurants] = React.useState<RestaurantWithDistance[]>(
    restaurants.map((r) => ({ restaurant: r, distance: null }))
  );

  const handleFilterChange = (filtered: RestaurantWithDistance[]) => {
    setFilteredRestaurants(filtered);
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
        </div>
      </section>

      {/* Restaurant Results */}
      <RestaurantResults restaurants={filteredRestaurants} />
    </>
  );
}
