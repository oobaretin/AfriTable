"use client";

import * as React from "react";
import Link from "next/link";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";
import { ExternalLink } from "lucide-react";

type RestaurantCardWithDistanceProps = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

export function RestaurantCardWithDistance({ restaurant, distance }: RestaurantCardWithDistanceProps) {
  const cuisine = restaurant.cuisine || "";
  const city = typeof restaurant.address === "string" 
    ? restaurant.address.split(",").map(s => s.trim())[1] || ""
    : "";
  
  // Format distance
  const formatDistance = (dist: number | null): string => {
    if (dist === null) return "";
    if (dist < 1) return `${(dist * 5280).toFixed(0)} ft away`;
    return `${dist.toFixed(1)} miles away`;
  };

  return (
    <div className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#C69C2B]/30 hover:bg-white/10 transition-all duration-300">
      {/* Header: Name and Distance */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#C69C2B] transition-colors">
            {restaurant.name}
          </h3>
          {distance !== null && (
            <p className="text-sm text-[#C69C2B] font-medium">
              {formatDistance(distance)}
            </p>
          )}
        </div>
        {restaurant.rating && (
          <div className="flex items-center gap-1 text-white/70">
            <span className="text-sm font-semibold">{restaurant.rating.toFixed(1)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#C69C2B]">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Cuisine and City */}
      <div className="mb-4 space-y-1">
        {cuisine && (
          <p className="text-sm font-medium text-white/80">
            {cuisine}
          </p>
        )}
        {city && (
          <p className="text-xs text-white/50 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {city}
          </p>
        )}
      </div>

      {/* Price Range */}
      {restaurant.price_range && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-white/60">
            {restaurant.price_range}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-center"
        >
          View Details
        </Link>
        {restaurant.website && (
          <a
            href={restaurant.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#C69C2B] hover:bg-[#C69C2B]/90 text-[#050A18] text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Visit Website
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
