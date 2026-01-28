"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type ZipCodeSearchProps = {
  restaurants: JSONRestaurant[];
  onFilterChange: (filteredRestaurants: JSONRestaurant[]) => void;
};

// Extract zip code from address string
function extractZipCode(address: string | unknown): string | null {
  if (typeof address !== "string") return null;
  
  // Try to match 5-digit zip code pattern
  // Format: "Street, City, ST 12345" or "Street, City, ST12345"
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : null;
}

export function ZipCodeSearch({ restaurants, onFilterChange }: ZipCodeSearchProps) {
  const [zipCode, setZipCode] = React.useState("");

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5); // Only digits, max 5
    setZipCode(value);
  };

  React.useEffect(() => {
    if (zipCode.length === 5) {
      // Filter restaurants by zip code
      const filtered = restaurants.filter((restaurant) => {
        const restaurantZip = extractZipCode(restaurant.address);
        return restaurantZip === zipCode;
      });
      onFilterChange(filtered);
    } else {
      // Reset to show all restaurants when zip is cleared
      onFilterChange(restaurants);
    }
  }, [zipCode, restaurants, onFilterChange]);

  return (
    <div className="w-full max-w-md mx-auto">
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
        <p className="mt-2 text-xs text-white/50 text-center">
          Enter 5 digits
        </p>
      )}
    </div>
  );
}
