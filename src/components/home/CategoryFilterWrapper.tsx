"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CategoryFilter } from "./CategoryFilter";
import { CityFilter } from "./CityFilter";
import { RestaurantGrid } from "./RestaurantGrid";
import { StaffPicks } from "./StaffPicks";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type CategoryFilterWrapperProps = {
  restaurants: JSONRestaurant[];
  onCountChange?: (count: number, total: number) => void;
};

/** Map URL `?city=` values to CityFilter labels (must stay in sync with CityFilter + RestaurantGrid.matchesCity). */
function cityFromUrlToDisplay(urlCity: string): string {
  const raw = urlCity.trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const first = lower.split(",")[0].trim();

  if (first === "nyc" || first === "new york city" || first === "new york" || first === "brooklyn" || first === "manhattan")
    return "NYC";
  if (first === "dc" || first === "washington" || first === "washington d.c" || first === "washington dc") return "DC";
  if (first === "la" || first === "los angeles") return "LA";
  if (first.includes("philadelphia") || first === "philly") return "Philadelphia";
  if (first === "houston") return "Houston";
  if (first === "atlanta") return "Atlanta";
  if (first === "miami") return "Miami";
  if (first === "chicago") return "Chicago";
  if (first === "seattle") return "Seattle";
  if (first === "new orleans") return "New Orleans";
  if (first === "dallas") return "Dallas";
  if (first === "boston") return "Boston";
  if (first === "denver") return "Denver";
  if (first === "austin") return "Austin";
  if (first === "san francisco") return "San Francisco";
  if (first === "oakland") return "Oakland";
  if (first === "minneapolis") return "Minneapolis";
  if (first === "portland") return "Portland";
  if (first === "detroit") return "Detroit";
  if (first === "nashville") return "Nashville";
  if (first === "charleston") return "Charleston";
  if (first === "san antonio") return "San Antonio";

  return raw.split(",")[0].trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CategoryFilterWrapper({ restaurants, onCountChange }: CategoryFilterWrapperProps) {
  const searchParams = useSearchParams();
  const urlCity = searchParams.get("city")?.trim() || "";
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [activeCity, setActiveCity] = React.useState<string>(() => cityFromUrlToDisplay(urlCity));

  // Keep city in sync with URL when navigating (e.g. from Find Table search)
  React.useEffect(() => {
    const next = cityFromUrlToDisplay(searchParams.get("city")?.trim() || "");
    setActiveCity((prev) => (next !== prev ? next : prev));
  }, [searchParams]);

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
