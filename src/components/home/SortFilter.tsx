"use client";

import type { RestaurantSortOption } from "@/lib/restaurant-filter-url";

const SORT_OPTIONS: { label: string; value: RestaurantSortOption }[] = [
  { label: "Recommended", value: "default" },
  { label: "Highest rated", value: "rating" },
  { label: "Name A–Z", value: "name" },
  { label: "Price: low to high", value: "price-low" },
  { label: "Price: high to low", value: "price-high" },
  { label: "Nearest", value: "distance" },
];

export function SortFilter({
  activeSort,
  setActiveSort,
  distanceAvailable,
}: {
  activeSort: RestaurantSortOption;
  setActiveSort: (sort: RestaurantSortOption) => void;
  distanceAvailable: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="restaurant-sort" className="text-[10px] font-bold uppercase tracking-widest text-white/40 shrink-0">
        Sort
      </label>
      <select
        id="restaurant-sort"
        value={activeSort}
        onChange={(e) => setActiveSort(e.target.value as RestaurantSortOption)}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white focus:border-[#C69C2B]/50 focus:outline-none focus:ring-2 focus:ring-[#C69C2B]/20"
      >
        {SORT_OPTIONS.filter((opt) => opt.value !== "distance" || distanceAvailable).map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#050A18] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
