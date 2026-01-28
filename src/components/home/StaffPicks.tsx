"use client";

import * as React from "react";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { transformJSONRestaurantToDetail, type JSONRestaurant } from "@/lib/restaurant-json-loader";

type StaffPicksProps = {
  restaurants: JSONRestaurant[];
};

export function StaffPicks({ restaurants }: StaffPicksProps) {
  // Filter and transform featured restaurants
  const featuredRestaurants = React.useMemo(() => {
    return restaurants
      .filter((r) => r.featured === true)
      .map((r) => transformJSONRestaurantToDetail(r));
  }, [restaurants]);

  if (featuredRestaurants.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-12">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-serif text-[#C69C2B] font-normal mb-2">
          The 2026 Staff Picks
        </h2>
        <p className="text-sm text-white/50 uppercase tracking-wider">
          Award-Winning Destinations
        </p>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredRestaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="flex-shrink-0 w-[320px] snap-start"
            >
              <RestaurantCard
                restaurant={restaurant}
                href={`/restaurants/${restaurant.slug}`}
                index={index}
                isFeatured={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
