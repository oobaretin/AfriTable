"use client";

import * as React from "react";
import { RestaurantGrid } from "./RestaurantGrid";
import { StaffPicks } from "./StaffPicks";
import { RestaurantDirectoryFilterBar } from "@/components/restaurants/RestaurantDirectoryFilterBar";
import { useRestaurantFiltersContext } from "@/contexts/restaurant-filters-context";

export function CategoryFilterWrapper() {
  const { filteredResults } = useRestaurantFiltersContext();
  const [displayCount, setDisplayCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(filteredResults.length);

  React.useEffect(() => {
    setTotalCount(filteredResults.length);
  }, [filteredResults.length]);

  const handleCountChange = (count: number, total: number) => {
    setDisplayCount(count);
    setTotalCount(total);
  };

  const restaurants = React.useMemo(
    () => filteredResults.map((item) => item.restaurant),
    [filteredResults],
  );

  return (
    <div className="w-full">
      <div className="bg-[#000814] px-6 pb-4 pt-2 text-center">
        <h2 className="font-serif text-xl font-normal text-[#C69C2B] md:text-2xl">
          Explore the directory
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
          Filter by name, city, cuisine, vibe, or zip code. All filters work together and update the URL so you can
          share your search.
        </p>
      </div>

      <RestaurantDirectoryFilterBar />

      <div className="bg-[#050A18] pb-4 pt-3">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm uppercase tracking-[0.1em] text-white/50 md:text-base">
            {displayCount > 0 && totalCount > 0 ? (
              <>Showing {displayCount} of {totalCount} destinations</>
            ) : (
              <>{totalCount} destinations across the United States</>
            )}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-4">
        <StaffPicks restaurants={restaurants} />
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-6">
        <RestaurantGrid filteredResults={filteredResults} onCountChange={handleCountChange} />
      </div>
    </div>
  );
}
