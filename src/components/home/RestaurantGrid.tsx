"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { transformJSONRestaurantToDetail, type JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantGridProps = {
  restaurants: JSONRestaurant[];
  activeCategory?: string;
  activeCity?: string;
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
  activeCategory: externalActiveCategory,
  activeCity: externalActiveCity
}: RestaurantGridProps) {
  const searchParams = useSearchParams();
  const urlCityFilter = searchParams.get("city")?.toLowerCase().trim() || "";
  const [internalActiveCategory] = React.useState<string>("All");
  
  // Use external state if provided, otherwise use internal state or URL params
  const activeCategory = externalActiveCategory ?? internalActiveCategory;
  const activeCity = externalActiveCity ?? urlCityFilter;

  // Helper to check if restaurant matches selected city
  function matchesCity(restaurantCity: string, selectedCity: string): boolean {
    const cityLower = selectedCity.toLowerCase();
    const restaurantCityLower = restaurantCity.toLowerCase();
    
    // Handle special city name mappings
    if (cityLower === "nyc" || cityLower === "new york city") {
      return restaurantCityLower.includes("new york") || 
             restaurantCityLower.includes("brooklyn") ||
             restaurantCityLower.includes("manhattan") ||
             restaurantCityLower.includes("queens") ||
             restaurantCityLower.includes("bronx");
    }
    if (cityLower === "dc" || cityLower === "washington") {
      return restaurantCityLower.includes("washington") || 
             restaurantCityLower.includes("dc");
    }
    if (cityLower === "la" || cityLower === "los angeles") {
      return restaurantCityLower.includes("los angeles") || 
             restaurantCityLower.includes("la");
    }
    if (cityLower === "philadelphia") {
      return restaurantCityLower.includes("philadelphia") || 
             restaurantCityLower.includes("philly");
    }
    
    // Direct match for other cities
    return restaurantCityLower.includes(cityLower);
  }

  // Filter restaurants by cuisine and city
  const filteredJSONRestaurants = React.useMemo(() => {
    let filtered = jsonRestaurants;

    // Filter by city if provided
    if (activeCity) {
      filtered = filtered.filter((r) => {
        const restaurantCity = extractCityFromAddress(r.address);
        return matchesCity(restaurantCity, activeCity);
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
  }, [jsonRestaurants, activeCategory, activeCity]);

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
        <div className="text-center py-16 animate-in fade-in duration-300">
          <p className="text-white/70 text-lg mb-2">
            No destinations match your selection.
          </p>
          <p className="text-white/50 text-sm">
            Explore another city?
          </p>
        </div>
      )}
    </div>
  );
}
