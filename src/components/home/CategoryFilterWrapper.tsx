"use client";

import * as React from "react";
import { CategoryFilter } from "./CategoryFilter";
import { CityFilter } from "./CityFilter";
import { RestaurantGrid } from "./RestaurantGrid";
import { StaffPicks } from "./StaffPicks";
import { useRestaurantFiltersContext } from "@/contexts/restaurant-filters-context";

type CategoryFilterWrapperProps = {
  onCountChange?: (count: number, total: number) => void;
};

export function CategoryFilterWrapper({ onCountChange }: CategoryFilterWrapperProps) {
  const { filters, setCity, setCuisine, filteredResults } = useRestaurantFiltersContext();

  const restaurants = React.useMemo(
    () => filteredResults.map((item) => item.restaurant),
    [filteredResults],
  );

  return (
    <div className="w-full">
      <div className="sticky top-0 z-30 bg-[#050A18]/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CategoryFilter
                activeCategory={filters.cuisine}
                setActiveCategory={setCuisine}
              />
            </div>
            <div className="flex-shrink-0">
              <CityFilter activeCity={filters.city} setActiveCity={setCity} />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <StaffPicks restaurants={restaurants} />
      </div>

      <div className="pt-6">
        <RestaurantGrid filteredResults={filteredResults} onCountChange={onCountChange} />
      </div>
    </div>
  );
}
