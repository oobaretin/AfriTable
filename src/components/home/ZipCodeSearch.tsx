"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";
import { getZipCodeCoordinates, calculateDistance } from "@/lib/geocoding";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number;
};

type ZipCodeSearchProps = {
  restaurants: JSONRestaurant[];
  onFilterChange: (filteredRestaurants: RestaurantWithDistance[]) => void;
};

// Extract zip code from restaurant (prefer explicit zip field, fallback to address parsing)
function getRestaurantZipCode(restaurant: JSONRestaurant): string | null {
  // First, try the explicit zip field
  if (restaurant.zip) {
    return restaurant.zip;
  }
  
  // Fallback: extract from address string
  if (typeof restaurant.address === "string") {
    const zipMatch = restaurant.address.match(/\b(\d{5})\b/);
    return zipMatch ? zipMatch[1] : null;
  }
  
  return null;
}

// Get restaurant coordinates
function getRestaurantCoordinates(restaurant: JSONRestaurant): { lat: number; lng: number } | null {
  // First, try explicit lat/lng fields
  if (restaurant.lat !== undefined && restaurant.lng !== undefined) {
    return { lat: restaurant.lat, lng: restaurant.lng };
  }
  
  // Fallback: try to get from zip code
  const zip = getRestaurantZipCode(restaurant);
  if (zip) {
    return getZipCodeCoordinates(zip);
  }
  
  return null;
}

export function ZipCodeSearch({ restaurants, onFilterChange }: ZipCodeSearchProps) {
  const [zipCode, setZipCode] = React.useState("");
  const [radius, setRadius] = React.useState(10); // Default 10 miles

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5); // Only digits, max 5
    setZipCode(value);
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRadius(Number(e.target.value));
  };

  React.useEffect(() => {
    if (zipCode.length === 5) {
      // Get user's zip code coordinates
      const userCoords = getZipCodeCoordinates(zipCode);
      
      if (!userCoords) {
        // If zip code not found in lookup, fall back to exact zip match
        const filtered: RestaurantWithDistance[] = restaurants
          .filter((restaurant) => {
            const restaurantZip = getRestaurantZipCode(restaurant);
            return restaurantZip === zipCode;
          })
          .map((restaurant) => ({ restaurant, distance: 0 }));
        onFilterChange(filtered);
        return;
      }

      // Filter and calculate distances
      const restaurantsWithDistance = restaurants
        .map((restaurant) => {
          const restaurantCoords = getRestaurantCoordinates(restaurant);
          if (!restaurantCoords) {
            // If no coordinates, check if zip matches exactly
            const restaurantZip = getRestaurantZipCode(restaurant);
            if (restaurantZip === zipCode) {
              return { restaurant, distance: 0 };
            }
            return null;
          }

          const distance = calculateDistance(
            userCoords.lat,
            userCoords.lng,
            restaurantCoords.lat,
            restaurantCoords.lng
          );

          return { restaurant, distance };
        })
        .filter((item): item is { restaurant: JSONRestaurant; distance: number } => {
          if (!item) return false;
          return item.distance <= radius;
        })
        .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

      // Extract just the restaurants (sorted by distance)
      const filtered = restaurantsWithDistance.map((item) => item.restaurant);
      onFilterChange(filtered);
    } else {
      // Reset to show all restaurants when zip is cleared
      const allRestaurants: RestaurantWithDistance[] = restaurants.map((restaurant) => ({ 
        restaurant, 
        distance: null 
      }));
      onFilterChange(allRestaurants);
    }
  }, [zipCode, radius, restaurants, onFilterChange]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Zip Code Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={zipCode}
          onChange={handleZipChange}
          placeholder="Enter your zip code"
          maxLength={5}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#C69C2B]/50 focus:ring-2 focus:ring-[#C69C2B]/20 transition-all duration-300"
        />
      </div>
      {zipCode.length > 0 && zipCode.length < 5 && (
        <p className="text-xs text-white/50 text-center">
          Enter 5 digits
        </p>
      )}

      {/* Radius Slider */}
      {zipCode.length === 5 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70 font-medium">
              Search Radius
            </label>
            <span className="text-sm text-[#C69C2B] font-semibold">
              {radius} miles
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={radius}
              onChange={handleRadiusChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C69C2B]"
              style={{
                background: `linear-gradient(to right, #C69C2B 0%, #C69C2B ${((radius - 5) / 45) * 100}%, rgba(255,255,255,0.1) ${((radius - 5) / 45) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="flex justify-between mt-2 text-[10px] text-white/40">
              <span>5 mi</span>
              <span>10 mi</span>
              <span>25 mi</span>
              <span>50 mi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
