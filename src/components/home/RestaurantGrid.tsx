"use client";

import * as React from "react";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { transformJSONRestaurantToDetail, type JSONRestaurant } from "@/lib/restaurant-json-loader";
import { CategoryFilter } from "./CategoryFilter";

type RestaurantGridProps = {
  restaurants: JSONRestaurant[];
};

export function RestaurantGrid({ restaurants: jsonRestaurants }: RestaurantGridProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("All");

  // Filter restaurants by cuisine field from JSON before transforming
  const filteredJSONRestaurants = React.useMemo(() => {
    if (activeCategory === "All") {
      return jsonRestaurants;
    }
    return jsonRestaurants.filter((r) => {
      const cuisine = r.cuisine?.toLowerCase() || "";
      return cuisine === activeCategory.toLowerCase();
    });
  }, [jsonRestaurants, activeCategory]);

  // Transform filtered JSON restaurants to RestaurantCard format
  const transformedRestaurants = React.useMemo(() => {
    return filteredJSONRestaurants.map((r) => transformJSONRestaurantToDetail(r));
  }, [filteredJSONRestaurants]);

  return (
    <div className="w-full">
      {/* Category Filter */}
      <CategoryFilter activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

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
