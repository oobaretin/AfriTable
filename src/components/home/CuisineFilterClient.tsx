"use client";

import * as React from "react";
import { CuisineFilter } from "./CuisineFilter";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";

type FeaturedRestaurant = {
  id: string;
  name: string;
  slug: string;
  cuisine_types: string[];
  price_range: number;
  address: unknown;
  images: string[];
  created_at: string;
  avg_rating: number | null;
  review_count: number;
};

type CuisineFilterClientProps = {
  restaurants: FeaturedRestaurant[];
};

export function CuisineFilterClient({ restaurants }: CuisineFilterClientProps) {
  const [selectedCuisines, setSelectedCuisines] = React.useState<string[]>([]);

  const toggleCuisine = React.useCallback((cuisine: string) => {
    setSelectedCuisines((prev) => {
      if (prev.includes(cuisine)) {
        return prev.filter((c) => c !== cuisine);
      }
      return [...prev, cuisine];
    });
  }, []);

  const filteredRestaurants = React.useMemo(() => {
    if (selectedCuisines.length === 0) {
      return restaurants;
    }
    return restaurants.filter((r) =>
      selectedCuisines.some((selected) =>
        (r.cuisine_types || []).some((ct) => ct.toLowerCase() === selected.toLowerCase()),
      ),
    );
  }, [restaurants, selectedCuisines]);

  return (
    <>
      <CuisineFilter selectedCuisines={selectedCuisines} onCuisineToggle={toggleCuisine} />
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(filteredRestaurants.length ? filteredRestaurants : Array.from({ length: 6 })).map((r: any, idx: number) => (
          <div key={r?.id ?? idx} className="w-[280px] shrink-0 md:w-[320px]">
            {r ? (
              <RestaurantCard restaurant={r} href={`/restaurants/${encodeURIComponent(r.slug)}`} />
            ) : (
              <div className="h-full rounded-lg border bg-card p-6">
                <div className="text-base font-semibold">Coming soon</div>
                <div className="mt-1 text-sm text-muted-foreground">We&apos;re onboarding restaurants now.</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {filteredRestaurants.length === 0 && selectedCuisines.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          No restaurants found for the selected cuisines. Try selecting different cuisines or{" "}
          <button
            type="button"
            onClick={() => setSelectedCuisines([])}
            className="underline underline-offset-4 hover:text-foreground"
          >
            clear filters
          </button>
          .
        </div>
      )}
    </>
  );
}
