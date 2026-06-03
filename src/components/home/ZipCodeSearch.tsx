"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";
import { filterRestaurantsByZip } from "@/lib/restaurant-zip-filter";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type ZipCodeSearchProps = {
  /** Legacy homepage mode: filter locally and notify parent. */
  restaurants?: JSONRestaurant[];
  onFilterChange?: (filteredRestaurants: RestaurantWithDistance[]) => void;
  /** URL-synced mode for /restaurants (controlled). */
  zip?: string;
  radius?: number;
  onZipChange?: (zip: string) => void;
  onRadiusChange?: (radius: number) => void;
};

export function ZipCodeSearch({
  restaurants = [],
  onFilterChange,
  zip: controlledZip,
  radius: controlledRadius,
  onZipChange,
  onRadiusChange,
}: ZipCodeSearchProps) {
  const zipInputId = React.useId();
  const isControlled = onZipChange != null;

  const [internalZip, setInternalZip] = React.useState("");
  const [internalRadius, setInternalRadius] = React.useState(10);

  const zipCode = isControlled ? (controlledZip ?? "") : internalZip;
  const radius = isControlled ? (controlledRadius ?? 10) : internalRadius;

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
    if (isControlled) {
      onZipChange?.(value);
    } else {
      setInternalZip(value);
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (isControlled) {
      onRadiusChange?.(value);
    } else {
      setInternalRadius(value);
    }
  };

  React.useEffect(() => {
    if (isControlled || !onFilterChange) {
      return;
    }

    if (zipCode.length === 5) {
      const matches = filterRestaurantsByZip(restaurants, zipCode, radius);
      onFilterChange(
        matches.map((item) => ({
          restaurant: item.restaurant,
          distance: item.distance,
        })),
      );
      return;
    }

    onFilterChange(
      restaurants.map((restaurant) => ({
        restaurant,
        distance: null,
      })),
    );
  }, [isControlled, zipCode, radius, restaurants, onFilterChange]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          id={`${zipInputId}-zip-code-search`}
          name="zipCode"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={zipCode}
          onChange={handleZipChange}
          placeholder="Enter your zip code"
          maxLength={5}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#C69C2B]/50 focus:ring-2 focus:ring-[#C69C2B]/20 transition-all duration-300"
          aria-label="Enter zip code to find nearby restaurants"
        />
      </div>
      {zipCode.length > 0 && zipCode.length < 5 && (
        <p className="text-xs text-white/50 text-center">Enter 5 digits</p>
      )}

      {zipCode.length === 5 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70 font-medium">Search Radius</label>
            <span className="text-sm text-[#C69C2B] font-semibold">{radius} miles</span>
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
                background: `linear-gradient(to right, #C69C2B 0%, #C69C2B ${((radius - 5) / 45) * 100}%, rgba(255,255,255,0.1) ${((radius - 5) / 45) * 100}%, rgba(255,255,255,0.1) 100%)`,
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
