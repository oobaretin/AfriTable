"use client";

import * as React from "react";
import { CuisineFilter } from "./CuisineFilter";
import { RestaurantCard, type RestaurantCardRestaurant } from "@/components/restaurant/RestaurantCard";

type CuisineFilterClientProps = {
  restaurants: RestaurantCardRestaurant[];
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
        {filteredRestaurants.map((r) => (
          <div key={r.id} className="w-[280px] shrink-0 md:w-[320px]">
            <RestaurantCard
              restaurant={r}
              href={`/restaurants/${encodeURIComponent(r.slug || r.id)}`}
            />
          </div>
        ))}
      </div>
      {filteredRestaurants.length === 0 && selectedCuisines.length > 0 && (
        <div className="mt-6 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
          <p className="text-base font-medium text-foreground">No matches for those cuisines</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different combination,{" "}
            <button
              type="button"
              onClick={() => setSelectedCuisines([])}
              className="underline underline-offset-4 hover:text-foreground"
            >
              clear filters
            </button>
            , or browse the{" "}
            <a href="/restaurants" className="underline underline-offset-4 hover:text-foreground">
              full directory
            </a>
            .
          </p>
        </div>
      )}
    </>
  );
}
