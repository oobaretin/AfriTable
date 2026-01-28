"use client";

import * as React from "react";
import Link from "next/link";
import { RestaurantCardWithDistance } from "./RestaurantCardWithDistance";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type RestaurantResultsProps = {
  restaurants: RestaurantWithDistance[];
};

// Helper function to extract city from address string
function extractCityFromAddress(address: string | unknown): string {
  if (typeof address === "string") {
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const cityState = parts[1];
      const cityMatch = cityState.match(/^([^,]+)/);
      return cityMatch ? cityMatch[1].trim() : "";
    }
  }
  return "";
}

// Helper to check if restaurant is featured (price_range === "$$$")
function isFeatured(restaurant: JSONRestaurant): boolean {
  return restaurant.price_range === "$$$";
}

export function RestaurantResults({ restaurants }: RestaurantResultsProps) {
  const { openDrawer } = useBookingDrawer();

  // Show only 4 featured restaurants initially for minimalist feel
  // If restaurants are filtered (e.g., by zip code), show all filtered results
  const displayedRestaurants = React.useMemo(() => {
    // If we have fewer restaurants than the full dataset, they're likely filtered
    // Show all filtered results (they're already filtered by zip code)
    // We'll use a threshold: if less than 50 restaurants, assume it's a filtered set
    const FULL_DATASET_SIZE = 50; // Approximate full dataset size
    if (restaurants.length < FULL_DATASET_SIZE && restaurants.length > 0) {
      return restaurants;
    }
    
    // Otherwise, show only 4 featured restaurants for minimalist feel
    // Get all featured restaurants
    const allFeatured = restaurants.filter(isFeatured);
    
    // Prioritize by key cities: NYC, Houston, Atlanta, DC, Miami, LA
    const keyCities = [
      "new york city",
      "houston",
      "atlanta",
      "washington d.c.",
      "miami",
      "los angeles",
    ];
    
    // Helper to check if restaurant is from a key city
    const isFromKeyCity = (r: JSONRestaurant): boolean => {
      const city = extractCityFromAddress(r.address).toLowerCase();
      return keyCities.some((keyCity) => city.includes(keyCity));
    };
    
    // Separate featured restaurants by city priority
    const featuredFromKeyCities = allFeatured.filter(isFromKeyCity);
    const featuredOthers = allFeatured.filter((r) => !isFromKeyCity(r));
    
    // Combine: featured from key cities first, then other featured
    const combined = [...featuredFromKeyCities, ...featuredOthers];
    
    // Return only the first 4 for initial view
    return combined.slice(0, 4);
  }, [restaurants]);


  if (displayedRestaurants.length === 0) {
    return (
      <section className="pt-24 pb-0 bg-[#050A18] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h2 className="text-2xl md:text-3xl font-serif text-[#C69C2B] font-normal mb-4">
              {isSearchMode ? "No Spots Found" : "Coming Soon to Your Area"}
            </h2>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {isSearchMode 
                ? "Expanding our reach soon! No spots found within this distance."
                : "We're working on expanding our network of authentic African and Caribbean restaurants. Join our waitlist to be notified when we add restaurants near you."
              }
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-12 pb-24 bg-[#050A18] px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Different for search mode vs featured */}
        {isSearchMode ? (
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-serif text-[#C69C2B] font-normal mb-2">
              Restaurants Near You
            </h2>
            <p className="text-sm text-white/60">
              {displayedRestaurants.length} {displayedRestaurants.length === 1 ? "restaurant" : "restaurants"} found
            </p>
          </div>
        ) : (
          <div className="mb-16 border-l-4 border-[#A33B32] pl-8">
            <h2 className="text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.5em] mb-2">
              Selected Destinations
            </h2>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">
              Featured Establishments
            </h3>
          </div>
        )}

        {/* Restaurant Grid */}
        <div className={`grid gap-6 ${
          isSearchMode 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1 md:grid-cols-2"
        }`}>
          {displayedRestaurants.map((item) => (
            <RestaurantCardWithDistance
              key={item.restaurant.id}
              restaurant={item.restaurant}
              distance={item.distance}
            />
          ))}
        </div>

        {/* See All Destinations Button - Only show in featured mode */}
        {!isSearchMode && (
          <div className="mt-16 flex justify-center">
            <Link
              href="/restaurants"
              className="group relative bg-transparent hover:bg-[#C69C2B]/10 border border-[#C69C2B] text-[#C69C2B] text-[10px] font-black px-8 py-4 rounded-full uppercase tracking-widest transition-all duration-500 flex items-center gap-3 hover:shadow-[0_0_15px_rgba(198,156,43,0.4)]"
            >
              <span>See All Destinations</span>
              <span className="text-lg transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
