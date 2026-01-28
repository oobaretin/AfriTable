"use client";

import * as React from "react";
import Link from "next/link";
import { RestaurantCardWithDistance } from "./RestaurantCardWithDistance";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type RestaurantResultsProps = {
  restaurants: RestaurantWithDistance[];
};

export function RestaurantResults({ restaurants }: RestaurantResultsProps) {
  // Check if we're in search mode (has distance data)
  const isSearchMode = restaurants.length > 0 && restaurants[0].distance !== null;
  
  // In search mode, show all results (already filtered and sorted by distance)
  // Otherwise, show featured restaurants (legacy behavior)
  const displayedRestaurants = React.useMemo(() => {
    if (isSearchMode) {
      return restaurants;
    }
    
    // Legacy: Show only 4 featured restaurants for minimalist feel
    const FULL_DATASET_SIZE = 50;
    if (restaurants.length < FULL_DATASET_SIZE && restaurants.length > 0) {
      return restaurants;
    }
    
    // Filter for featured restaurants (price_range === "$$$")
    const featured = restaurants.filter(
      (r) => r.restaurant.price_range === "$$$"
    );
    
    return featured.slice(0, 4);
  }, [restaurants, isSearchMode]);


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
              className="group relative bg-transparent hover:bg-[#C69C2B]/10 border border-[#C69C2B] text-[#C69C2B] text-[10px] font-black px-8 py-4 rounded-full uppercase tracking-widest transition-all duration-500 flex items-center gap-3 hover:shadow-[0_0_15px_rgba(198,156,43,0.4)] cursor-pointer inline-block"
              prefetch={true}
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
