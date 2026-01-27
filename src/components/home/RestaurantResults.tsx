"use client";

import * as React from "react";
import Link from "next/link";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantResultsProps = {
  restaurants: JSONRestaurant[];
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
  // Prioritize restaurants from key cities: NYC, Houston, Atlanta, DC
  // Mix of featured and non-featured to showcase variety
  const displayedRestaurants = React.useMemo(() => {
    const keyCities = ["new york city", "houston", "atlanta", "washington d.c."];
    
    // Helper to check if restaurant is from a key city
    const isFromKeyCity = (r: JSONRestaurant): boolean => {
      const city = extractCityFromAddress(r.address).toLowerCase();
      return keyCities.some((keyCity) => city.includes(keyCity));
    };
    
    // Separate restaurants by featured status and city priority
    const featuredFromKeyCities = restaurants.filter(
      (r) => isFeatured(r) && isFromKeyCity(r)
    );
    const othersFromKeyCities = restaurants.filter(
      (r) => !isFeatured(r) && isFromKeyCity(r)
    );
    const featuredOthers = restaurants.filter(
      (r) => isFeatured(r) && !isFromKeyCity(r)
    );
    const others = restaurants.filter(
      (r) => !isFeatured(r) && !isFromKeyCity(r)
    );
    
    // Prioritize: featured from key cities, then others from key cities, then other featured, then others
    // Aim for 6 total with good representation
    const combined = [
      ...featuredFromKeyCities.slice(0, 4), // Up to 4 featured from key cities
      ...othersFromKeyCities.slice(0, 2), // Up to 2 non-featured from key cities
      ...featuredOthers.slice(0, 1), // 1 other featured if space
      ...others.slice(0, 1), // 1 other if space
    ];
    
    return combined.slice(0, 6);
  }, [restaurants]);

  if (displayedRestaurants.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-[#050A18] px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header matching the 'Catchy Words' style */}
        <div className="mb-16 border-l-4 border-[#A33B32] pl-8">
          <h2 className="text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.5em] mb-2">
            Selected Destinations
          </h2>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">
            Featured Establishments
          </h3>
        </div>

        {/* The Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayedRestaurants.map((restaurant) => {
            const city = extractCityFromAddress(restaurant.address);
            const cuisine = restaurant.cuisine || "";
            const description = restaurant.about || "";
            const featured = isFeatured(restaurant);
            const slug = restaurant.id; // Use id as slug

            return (
              <div
                key={restaurant.id}
                className="group relative overflow-hidden bg-[#0A1120] border border-white/5 p-10 rounded-[2rem] transition-all duration-500 hover:border-[#C69C2B]/30 hover:shadow-[0_0_50px_rgba(198,156,43,0.05)]"
              >
                {/* Top Row: City & Cuisine */}
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <span className="text-[10px] font-black text-[#A33B32] uppercase tracking-widest block mb-1">
                      {city || "Location"}
                    </span>
                    <span className="text-xs font-medium text-white/40 uppercase tracking-[0.2em]">
                      {cuisine}
                    </span>
                  </div>
                  {featured && (
                    <span className="bg-[#C69C2B] text-[#050A18] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                      Ultimate Choice
                    </span>
                  )}
                </div>

                {/* Middle Row: Name & Description */}
                <div className="mb-12">
                  <h4 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 group-hover:text-[#C69C2B] transition-colors duration-300">
                    {restaurant.name}
                  </h4>
                  {description && (
                    <p className="text-slate-400 text-sm italic leading-relaxed max-w-xs">
                      &quot;{description}&quot;
                    </p>
                  )}
                </div>

                {/* Bottom Row: The 'Find Table' Action */}
                <div className="flex items-center justify-between border-t border-white/5 pt-8">
                  <Link
                    href={`/restaurants/${slug}`}
                    className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-4 group-hover:gap-6 transition-all"
                  >
                    View Details <span className="text-[#A33B32] text-xl">→</span>
                  </Link>
                  <Link
                    href={`/restaurants/${slug}`}
                    className="bg-white/5 hover:bg-[#A33B32] text-white text-[9px] font-black px-6 py-3 rounded-full uppercase tracking-widest transition-all"
                  >
                    Find Table
                  </Link>
                </div>

                {/* Subtle 3D Background Glow for each card */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-900/10 blur-[80px] group-hover:bg-[#C69C2B]/10 transition-all"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
