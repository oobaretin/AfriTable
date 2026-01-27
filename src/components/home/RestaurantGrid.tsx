"use client";

import * as React from "react";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { transformJSONRestaurantToDetail, loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader";

export function RestaurantGrid() {
  const [selectedCuisine, setSelectedCuisine] = React.useState<string | null>(null);
  const [restaurants, setRestaurants] = React.useState<any[]>([]);

  // Load restaurants from JSON and transform them
  React.useEffect(() => {
    try {
      const jsonRestaurants = loadRestaurantsFromJSON();
      const transformed = jsonRestaurants.map((r) => transformJSONRestaurantToDetail(r));
      setRestaurants(transformed);
    } catch (error) {
      console.error("[RestaurantGrid] Error loading restaurants:", error);
    }
  }, []);

  // Get unique cuisines from restaurants
  const cuisines = React.useMemo(() => {
    const cuisineSet = new Set<string>();
    restaurants.forEach((r) => {
      if (r.cuisine_types && Array.isArray(r.cuisine_types)) {
        r.cuisine_types.forEach((c: string) => cuisineSet.add(c));
      }
    });
    return Array.from(cuisineSet).sort();
  }, [restaurants]);

  // Filter restaurants by selected cuisine
  const filteredRestaurants = React.useMemo(() => {
    if (!selectedCuisine) {
      return restaurants;
    }
    return restaurants.filter((r) =>
      (r.cuisine_types || []).some((c: string) => c.toLowerCase() === selectedCuisine.toLowerCase())
    );
  }, [restaurants, selectedCuisine]);

  return (
    <div className="w-full">
      {/* Browse by Cuisine Filter */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Browse by Cuisine:</span>
        <button
          onClick={() => setSelectedCuisine(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedCuisine === null
              ? "bg-orange-600 text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {cuisines.map((cuisine) => (
          <button
            key={cuisine}
            onClick={() => setSelectedCuisine(cuisine)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCuisine === cuisine
                ? "bg-orange-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {/* Restaurant Grid - 3 columns */}
      {filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              href={`/restaurants/${restaurant.slug}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500">No restaurants found for the selected cuisine.</p>
        </div>
      )}
    </div>
  );
}
