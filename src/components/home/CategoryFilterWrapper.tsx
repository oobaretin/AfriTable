"use client";

import * as React from "react";
import { CategoryFilter } from "./CategoryFilter";
import { RestaurantGrid } from "./RestaurantGrid";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type CategoryFilterWrapperProps = {
  restaurants: JSONRestaurant[];
};

export function CategoryFilterWrapper({ restaurants }: CategoryFilterWrapperProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("All");

  return (
    <div className="w-full">
      {/* Sticky Filter Bar */}
      <CategoryFilter activeCategory={activeCategory} setActiveCategory={setActiveCategory} isSticky={true} />
      
      {/* Restaurant Grid with shared filter state */}
      <div className="pt-6">
        <RestaurantGrid 
          restaurants={restaurants} 
          activeCategory={activeCategory}
        />
      </div>
    </div>
  );
}
