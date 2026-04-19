"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { RestaurantCardSkeleton } from "./RestaurantCardSkeleton";
import { transformJSONRestaurantToDetail, type JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantGridProps = {
  restaurants: JSONRestaurant[];
  activeCategory?: string;
  activeCity?: string;
  onCountChange?: (count: number, total: number) => void;
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

/** Primary city token from filter (handles `Houston, TX` from trending links). */
function primaryCityToken(selected: string): string {
  const s = selected.trim().toLowerCase();
  if (!s) return "";
  return s.split(",")[0].trim();
}

function matchesCity(restaurantCity: string, selectedCity: string): boolean {
  const cityLower = primaryCityToken(selectedCity);
  if (!cityLower) return true;
  const restaurantCityLower = restaurantCity.toLowerCase();

  if (cityLower === "nyc" || cityLower === "new york" || cityLower === "new york city") {
    return (
      restaurantCityLower.includes("new york") ||
      restaurantCityLower.includes("brooklyn") ||
      restaurantCityLower.includes("manhattan") ||
      restaurantCityLower.includes("queens") ||
      restaurantCityLower.includes("bronx") ||
      restaurantCityLower.includes("flushing")
    );
  }
  if (cityLower === "dc" || cityLower === "washington") {
    return (
      restaurantCityLower.includes("washington") ||
      restaurantCityLower.includes("dc") ||
      restaurantCityLower.includes("bethesda") ||
      restaurantCityLower.includes("takoma park") ||
      restaurantCityLower.includes("falls church")
    );
  }
  if (cityLower === "la" || cityLower === "los angeles") {
    return (
      restaurantCityLower.includes("los angeles") ||
      restaurantCityLower.includes("inglewood") ||
      restaurantCityLower.includes("north hollywood")
    );
  }
  if (cityLower === "philadelphia" || cityLower === "philly") {
    return restaurantCityLower.includes("philadelphia") || restaurantCityLower.includes("philly");
  }
  if (cityLower === "dallas") {
    return (
      restaurantCityLower.includes("dallas") ||
      restaurantCityLower.includes("richardson") ||
      restaurantCityLower.includes("arlington")
    );
  }
  if (cityLower === "houston") {
    return (
      restaurantCityLower.includes("houston") ||
      restaurantCityLower.includes("katy") ||
      restaurantCityLower.includes("meadows place") ||
      restaurantCityLower.includes("richmond")
    );
  }
  if (cityLower === "miami") {
    return restaurantCityLower.includes("miami");
  }
  if (cityLower === "atlanta") {
    return restaurantCityLower.includes("atlanta") || restaurantCityLower.includes("peachtree corners");
  }
  if (cityLower === "boston") {
    return restaurantCityLower.includes("boston");
  }
  if (cityLower === "seattle") {
    return restaurantCityLower.includes("seattle");
  }
  if (cityLower === "new orleans") {
    return restaurantCityLower.includes("new orleans");
  }
  if (cityLower === "denver") {
    return restaurantCityLower.includes("denver");
  }
  if (cityLower === "austin") {
    return restaurantCityLower.includes("austin") || restaurantCityLower.includes("pflugerville");
  }
  if (cityLower === "san francisco") {
    return restaurantCityLower.includes("san francisco");
  }
  if (cityLower === "oakland") {
    return restaurantCityLower.includes("oakland");
  }
  if (cityLower === "minneapolis") {
    return restaurantCityLower.includes("minneapolis");
  }
  if (cityLower === "portland") {
    return restaurantCityLower.includes("portland");
  }
  if (cityLower === "detroit") {
    return restaurantCityLower.includes("detroit");
  }
  if (cityLower === "nashville") {
    return restaurantCityLower.includes("nashville");
  }
  if (cityLower === "charleston") {
    return restaurantCityLower.includes("charleston");
  }
  if (cityLower === "san antonio") {
    return restaurantCityLower.includes("san antonio");
  }
  if (cityLower === "chicago") {
    return restaurantCityLower.includes("chicago");
  }

  return restaurantCityLower.includes(cityLower) || cityLower.includes(restaurantCityLower);
}

const ITEMS_PER_PAGE = 12;

export function RestaurantGrid({
  restaurants: jsonRestaurants,
  activeCategory: externalActiveCategory,
  activeCity: externalActiveCity,
  onCountChange,
}: RestaurantGridProps) {
  const searchParams = useSearchParams();
  const urlCityFilter = searchParams.get("city")?.toLowerCase().trim() || "";
  const [internalActiveCategory] = React.useState<string>("All");
  const [displayCount, setDisplayCount] = React.useState<number>(ITEMS_PER_PAGE);

  // Initialize display count on mount
  React.useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, []);

  // Use external state if provided, otherwise use internal state or URL params
  const activeCategory = externalActiveCategory ?? internalActiveCategory;
  const activeCity = externalActiveCity ?? urlCityFilter;

  // Reset display count when filters change
  React.useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [activeCategory, activeCity]);

  // Filter restaurants by cuisine and city (include all restaurants, featured are shown in Staff Picks)
  const filteredJSONRestaurants = React.useMemo(() => {
    let filtered = [...jsonRestaurants]; // Include all restaurants

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

  // Get restaurants to display (paginated)
  const displayedRestaurants = React.useMemo(() => {
    return transformedRestaurants.slice(0, displayCount);
  }, [transformedRestaurants, displayCount]);

  // Notify parent of count changes
  React.useEffect(() => {
    if (onCountChange) {
      onCountChange(displayedRestaurants.length, transformedRestaurants.length);
    }
  }, [displayedRestaurants.length, transformedRestaurants.length, onCountChange]);

  // Load more handler
  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, transformedRestaurants.length));
  };

  const hasMore = displayedRestaurants.length < transformedRestaurants.length;

  // Always show grid structure to prevent layout collapse
  const isLoading = transformedRestaurants.length === 0 && jsonRestaurants.length > 0;
  const hasResults = transformedRestaurants.length > 0;

  return (
    <div className="w-full min-h-[100vh] flex flex-col">
      {/* Restaurant Grid - Always display grid structure */}
      <div 
        key={`${activeCategory}-${activeCity}`}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1"
      >
        {isLoading ? (
          // Show skeleton loaders while filtering
          Array.from({ length: 6 }).map((_, i) => (
            <RestaurantCardSkeleton key={`skeleton-${i}`} />
          ))
        ) : hasResults ? (
          // Show actual restaurant cards (paginated)
          displayedRestaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="animate-in fade-in duration-500"
              style={{
                animationDelay: `${Math.min(index % ITEMS_PER_PAGE, 5) * 50}ms`,
              }}
            >
              <RestaurantCard
                restaurant={restaurant}
                href={`/restaurants/${encodeURIComponent(restaurant.id || restaurant.slug)}`}
                index={index}
              />
            </div>
          ))
        ) : (
          // Show empty state (but keep grid structure)
          <div className="col-span-full text-center py-16">
            <p className="text-white/70 text-lg mb-2">No destinations match your selection.</p>
            <p className="text-white/50 text-sm mb-6">
              Try another city or browse the full nationwide directory.
            </p>
            <Link
              href="/restaurants"
              className="inline-flex rounded-full border border-[#C69C2B] px-6 py-3 text-sm font-bold uppercase tracking-widest text-[#C69C2B] transition-colors hover:bg-[#C69C2B]/10"
            >
              Browse all restaurants
            </Link>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasResults && hasMore && (
        <div className="flex justify-center mt-12">
          <button
            onClick={handleLoadMore}
            className="group relative bg-transparent hover:bg-[#C69C2B]/10 border border-[#C69C2B] text-[#C69C2B] text-sm font-bold px-8 py-4 rounded-full uppercase tracking-widest transition-all duration-500 hover:shadow-[0_0_15px_rgba(198,156,43,0.4)]"
          >
            Load More
            <span className="ml-2 inline-block transition-transform duration-500 group-hover:translate-y-1">
              ↓
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
