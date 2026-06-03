"use client";

import * as React from "react";
import { ZipCodeSearch } from "@/components/home/ZipCodeSearch";
import { VibeFilter } from "@/components/home/VibeFilter";
import { useRestaurantFiltersContext } from "@/contexts/restaurant-filters-context";

export function RestaurantsPageSearch() {
  const { filters, setZip, setRadius, setVibe } = useRestaurantFiltersContext();

  return (
    <section className="py-12 bg-[#000814] px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-serif text-[#C69C2B] font-normal mb-2">
            Find restaurants near you
          </h2>
          <p className="text-sm text-white/60 max-w-lg mx-auto">
            Browse the full U.S. directory by city and cuisine, or enter a zip code to sort by distance when you are
            planning a night out.
          </p>
        </div>
        <ZipCodeSearch
          zip={filters.zip}
          radius={filters.radius}
          onZipChange={setZip}
          onRadiusChange={setRadius}
        />

        <div className="mt-8">
          <div className="text-center mb-4">
            <p className="text-sm text-white/60 mb-3">Filter by vibe</p>
          </div>
          <VibeFilter selectedVibe={filters.vibe} onVibeChange={setVibe} />
        </div>
      </div>
    </section>
  );
}
