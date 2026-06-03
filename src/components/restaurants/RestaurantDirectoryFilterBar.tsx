"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { CategoryFilter } from "@/components/home/CategoryFilter";
import { CityFilter } from "@/components/home/CityFilter";
import { VibeFilter } from "@/components/home/VibeFilter";
import { ZipCodeSearch } from "@/components/home/ZipCodeSearch";
import { useRestaurantFiltersContext } from "@/contexts/restaurant-filters-context";

function RestaurantNameSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = React.useId();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        id={`${inputId}-restaurant-name-search`}
        name="restaurantName"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by restaurant name"
        className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-[#C69C2B]/50 focus:outline-none focus:ring-2 focus:ring-[#C69C2B]/20"
        aria-label="Search restaurants by name"
      />
    </div>
  );
}

function ActiveFilterSummary() {
  const { filters, setCity, setCuisine, setZip, setVibe, setQ, clearFilters, hasActiveFilters } =
    useRestaurantFiltersContext();

  if (!hasActiveFilters) {
    return null;
  }

  const pills: { label: string; onClear: () => void }[] = [];

  if (filters.city) {
    pills.push({ label: filters.city, onClear: () => setCity("") });
  }
  if (filters.cuisine !== "All") {
    pills.push({ label: filters.cuisine, onClear: () => setCuisine("All") });
  }
  if (filters.zip.length === 5) {
    pills.push({
      label: `Zip ${filters.zip} · ${filters.radius} mi`,
      onClear: () => setZip(""),
    });
  }
  if (filters.vibe !== "All") {
    pills.push({ label: filters.vibe, onClear: () => setVibe("All") });
  }
  if (filters.q) {
    pills.push({ label: `"${filters.q}"`, onClear: () => setQ("") });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active</span>
      {pills.map((pill) => (
        <button
          key={pill.label}
          type="button"
          onClick={pill.onClear}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#C69C2B]/40 bg-[#C69C2B]/10 px-3 py-1 text-xs font-semibold text-[#C69C2B] transition-colors hover:bg-[#C69C2B]/20"
        >
          {pill.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearFilters}
        className="ml-auto text-xs font-semibold text-white/50 underline-offset-2 hover:text-white hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

export function RestaurantDirectoryFilterBar() {
  const { filters, setCity, setCuisine, setZip, setRadius, setVibe, setQ } =
    useRestaurantFiltersContext();

  const [nameQuery, setNameQuery] = React.useState(filters.q);

  React.useEffect(() => {
    setNameQuery(filters.q);
  }, [filters.q]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      if (nameQuery.trim() !== filters.q) {
        setQ(nameQuery);
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [nameQuery, filters.q, setQ]);

  return (
    <section className="sticky top-0 z-30 border-b border-white/10 bg-[#050A18]/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <RestaurantNameSearch value={nameQuery} onChange={setNameQuery} />
          <ZipCodeSearch
            zip={filters.zip}
            radius={filters.radius}
            onZipChange={setZip}
            onRadiusChange={setRadius}
            compact
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CategoryFilter activeCategory={filters.cuisine} setActiveCategory={setCuisine} />
          </div>
          <div className="flex-shrink-0">
            <CityFilter activeCity={filters.city} setActiveCity={setCity} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Vibe</p>
          <VibeFilter selectedVibe={filters.vibe} onVibeChange={setVibe} />
        </div>

        <ActiveFilterSummary />
      </div>
    </section>
  );
}
