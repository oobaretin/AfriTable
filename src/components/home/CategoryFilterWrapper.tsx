"use client";

import * as React from "react";
import { CategoryFilter } from "./CategoryFilter";
import { CityFilter } from "./CityFilter";
import { RestaurantGrid } from "./RestaurantGrid";
import { StaffPicks } from "./StaffPicks";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type CategoryFilterWrapperProps = {
  restaurants: JSONRestaurant[];
  onCountChange?: (count: number, total: number) => void;
};

export function CategoryFilterWrapper({ restaurants, onCountChange }: CategoryFilterWrapperProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [activeCity, setActiveCity] = React.useState<string>("");

  return (
    <div className="w-full">
      {/* Sticky Filter Bar - Dual Filter System */}
      <div className="sticky top-0 z-30 bg-[#050A18]/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Scrollable Cuisine Chips */}
            <div className="flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CategoryFilter 
                activeCategory={activeCategory} 
                setActiveCategory={setActiveCategory}
              />
            </div>
            
            {/* Right: City Dropdown */}
            <div className="flex-shrink-0">
              <CityFilter activeCity={activeCity} setActiveCity={setActiveCity} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Staff Picks Section */}
      <div className="pt-6">
        <StaffPicks restaurants={restaurants} />
      </div>

      {/* Restaurant Grid with shared filter state */}
      <div className="pt-6">
        <RestaurantGrid 
          restaurants={restaurants} 
          activeCategory={activeCategory}
          activeCity={activeCity}
          onCountChange={onCountChange}
        />
      </div>
    </div>
  );
}
