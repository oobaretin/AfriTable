"use client";

import { useEffect, useState } from "react";
import { CategoryFilterWrapper } from "@/components/home/CategoryFilterWrapper";
import { useRestaurantFiltersContext } from "@/contexts/restaurant-filters-context";

export function RestaurantsGridClient() {
  const { filteredResults } = useRestaurantFiltersContext();
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(filteredResults.length);

  useEffect(() => {
    setTotalCount(filteredResults.length);
  }, [filteredResults.length]);

  const handleCountChange = (count: number, total: number) => {
    setDisplayCount(count);
    setTotalCount(total);
  };

  return (
    <>
      <div className="bg-[#050A18] pb-8 -mt-8">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm md:text-base text-white/50 tracking-[0.1em] uppercase">
            {displayCount > 0 && totalCount > 0 ? (
              <>Showing {displayCount} of {totalCount} destinations</>
            ) : (
              <>{totalCount} destinations across the United States</>
            )}
          </p>
        </div>
      </div>

      <CategoryFilterWrapper onCountChange={handleCountChange} />
    </>
  );
}
