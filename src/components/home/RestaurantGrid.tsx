"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { transformJSONRestaurantToDetail, type JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantGridProps = {
  restaurants: JSONRestaurant[];
  activeCategory?: string;
};

// Helper function to extract city from address string
function extractCityFromAddress(address: string | unknown): string {
  if (typeof address === "string") {
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const cityState = parts[1];
      const cityMatch = cityState.match(/^([^,]+)/);
      return cityMatch ? cityMatch[1].trim().toLowerCase() : "";
    }
  }
  return "";
}

export function RestaurantGrid({ 
  restaurants: jsonRestaurants, 
  activeCategory: externalActiveCategory
}: RestaurantGridProps) {
  const searchParams = useSearchParams();
  const cityFilter = searchParams.get("city")?.toLowerCase().trim() || "";
  const [internalActiveCategory] = React.useState<string>("All");
  
  // Use external state if provided, otherwise use internal state
  const activeCategory = externalActiveCategory ?? internalActiveCategory;

  // Filter restaurants by cuisine and city from URL params
  const filteredJSONRestaurants = React.useMemo(() => {
    let filtered = jsonRestaurants;

    // Filter by city if provided
    if (cityFilter) {
      filtered = filtered.filter((r) => {
        const restaurantCity = extractCityFromAddress(r.address);
        return restaurantCity.includes(cityFilter);
      });
    }

    // Filter by cuisine category (handles compound cuisines like "Haitian / Afro-Caribbean")
    if (activeCategory !== "All") {
      filtered = filtered.filter((r) => {
        const cuisine = r.cuisine?.toLowerCase() || "";
        const categoryLower = activeCategory.toLowerCase();
        // Check if cuisine exactly matches or contains the category
        return cuisine === categoryLower || cuisine.includes(categoryLower);
      });
    }

    return filtered;
  }, [jsonRestaurants, activeCategory, cityFilter]);

  // Transform filtered JSON restaurants to RestaurantCard format
  const transformedRestaurants = React.useMemo(() => {
    return filteredJSONRestaurants.map((r) => transformJSONRestaurantToDetail(r));
  }, [filteredJSONRestaurants]);

  return (
    <div className="w-full">
      {/* Restaurant Grid - 3 columns with fade transition */}
      {transformedRestaurants.length > 0 ? (
        <div 
          key={activeCategory}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300"
        >
          {transformedRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              href={`/restaurants/${restaurant.slug}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 animate-in fade-in duration-300">
          <p className="text-slate-500">
            {cityFilter
              ? `No restaurants found in ${cityFilter.charAt(0).toUpperCase() + cityFilter.slice(1)}${activeCategory !== "All" ? ` for ${activeCategory}` : ""}.`
              : `No restaurants found${activeCategory !== "All" ? ` for ${activeCategory}` : ""}.`}
          </p>
        </div>
      )}
    </div>
  );
}
