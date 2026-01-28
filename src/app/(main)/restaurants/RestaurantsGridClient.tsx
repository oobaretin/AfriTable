"use client";

import { useState } from "react";
import { CategoryFilterWrapper } from "@/components/home/CategoryFilterWrapper";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantsGridClientProps = {
  restaurants: JSONRestaurant[];
};

export function RestaurantsGridClient({ restaurants }: RestaurantsGridClientProps) {
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(restaurants.length);

  const handleCountChange = (count: number, total: number) => {
    setDisplayCount(count);
    setTotalCount(total);
  };

  return (
    <>
      {/* Dynamic Count Header */}
      <div className="bg-[#050A18] pb-8 -mt-8">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-sm md:text-base text-white/50 tracking-[0.1em] uppercase">
            {displayCount > 0 && totalCount > 0 ? (
              <>Showing {displayCount} of {totalCount} Destinations</>
            ) : (
              <>{totalCount} Destinations Across the Global Diaspora</>
            )}
          </p>
        </div>
      </div>

      <CategoryFilterWrapper 
        restaurants={restaurants} 
        onCountChange={handleCountChange}
      />
    </>
  );
}
