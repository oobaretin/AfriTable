"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type JSONRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  region: string;
  price_range: string;
  rating: number;
  address: string;
  images?: string[];
};

type RestaurantSearchBarProps = {
  restaurants: JSONRestaurant[];
};

// Extract city from address string
function extractCity(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const cityState = parts[1];
    const cityMatch = cityState.match(/^([^,]+)/);
    return cityMatch ? cityMatch[1].trim() : cityState;
  }
  return "";
}

export function RestaurantSearchBar({ restaurants }: RestaurantSearchBarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  // Filter restaurants based on search query
  const filteredRestaurants = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return restaurants
      .filter((r) => {
        const nameMatch = r.name.toLowerCase().includes(query);
        const cuisineMatch = r.cuisine.toLowerCase().includes(query);
        const city = extractCity(r.address).toLowerCase();
        const cityMatch = city.includes(query);

        return nameMatch || cuisineMatch || cityMatch;
      })
      .slice(0, 10); // Limit to 10 results for performance
  }, [restaurants, searchQuery]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="main-search"
          name="search"
          type="text"
          placeholder="Search by restaurant name, city, or cuisine..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
          aria-label="Search restaurants"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && searchQuery.trim() && (
        <Card className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[600px] overflow-y-auto shadow-lg">
          {filteredRestaurants.length > 0 ? (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {filteredRestaurants.length} {filteredRestaurants.length === 1 ? "result" : "results"} found
                </p>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
              <div className="space-y-4">
                {filteredRestaurants.map((r) => {
                  const city = extractCity(r.address);
                  return (
                    <Link
                      key={r.id}
                      href={`/restaurants/${r.id}`}
                      className="block cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold">{r.name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {r.cuisine}
                            </Badge>
                            {city && <span>• {city}</span>}
                            <span>• {r.price_range}</span>
                            {r.rating && <span>• {r.rating.toFixed(1)}★</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No restaurants found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
