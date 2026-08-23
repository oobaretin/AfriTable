"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { filterCitySuggestions } from "@/lib/hero-city";
import {
  buildRestaurantsDirectoryHref,
  filtersFromHeroSearchInput,
} from "@/lib/restaurant-filter-url";

export function NavbarSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (query.trim()) {
      const filtered = filterCitySuggestions(query);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function navigate(raw: string) {
    const partial = filtersFromHeroSearchInput(raw);
    router.push(buildRestaurantsDirectoryHref(partial));
    setShowSuggestions(false);
    setQuery("");
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const raw = query.trim();
    if (!raw) {
      router.push("/restaurants");
      return;
    }
    if (showSuggestions && suggestions.length > 0) {
      navigate(suggestions[0]);
      return;
    }
    navigate(raw);
  }

  return (
    <div ref={containerRef} className="relative hidden flex-1 max-w-md lg:block">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim()) setShowSuggestions(true);
          }}
          placeholder="City or restaurant name"
          className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Search restaurants by city or name"
        />
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => navigate(suggestion)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-accent"
            >
              <span className="text-brand-mutedRed">📍</span>
              <span className="font-medium">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
