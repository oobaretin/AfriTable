"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/layout/Reveal";

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  region: string;
  price_range: string;
  rating: number;
  address: string;
};

type CityGroup = {
  city: string;
  displayName: string;
  restaurants: Restaurant[];
};

// Extract city from address string
function extractCity(address: string): string {
  // Try to parse format: "6991 S Texas 6, Houston, TX 77083"
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const cityState = parts[1];
    // Extract just the city name (before state)
    const cityMatch = cityState.match(/^([^,]+)/);
    return cityMatch ? cityMatch[1].trim() : cityState;
  }
  return "";
}

// Normalize city name for grouping
function normalizeCity(city: string): { key: string; display: string } {
  const lower = city.toLowerCase();
  
  if (lower.includes("washington") || lower.includes("dc") || lower.includes("takoma park")) {
    return { key: "washington-dc", display: "Washington, DC" };
  }
  if (lower.includes("new york") || lower.includes("nyc") || lower.includes("brooklyn")) {
    return { key: "new-york", display: "New York, NY" };
  }
  if (lower.includes("houston")) {
    return { key: "houston", display: "Houston, TX" };
  }
  if (lower.includes("chicago")) {
    return { key: "chicago", display: "Chicago, IL" };
  }
  if (lower.includes("atlanta")) {
    return { key: "atlanta", display: "Atlanta, GA" };
  }
  if (lower.includes("miami")) {
    return { key: "miami", display: "Miami, FL" };
  }
  if (lower.includes("richardson")) {
    return { key: "houston", display: "Houston, TX" }; // Richardson is in Houston metro
  }
  
  return { key: city.toLowerCase(), display: city };
}

// Parse restaurants data and group by city
function groupRestaurantsByCity(restaurants: Restaurant[]): CityGroup[] {
  const cityMap = new Map<string, Restaurant[]>();

  for (const restaurant of restaurants) {
    const city = extractCity(restaurant.address);
    if (!city) continue;

    const normalized = normalizeCity(city);
    
    if (!cityMap.has(normalized.key)) {
      cityMap.set(normalized.key, []);
    }
    cityMap.get(normalized.key)!.push(restaurant);
  }

  // Convert to array and sort by restaurant count
  return Array.from(cityMap.entries())
    .map(([cityKey, restaurants]) => {
      const firstCity = extractCity(restaurants[0]?.address || "");
      const normalized = normalizeCity(firstCity);
      return {
        city: cityKey,
        displayName: normalized.display,
        restaurants,
      };
    })
    .filter((group) => group.restaurants.length > 0)
    .sort((a, b) => b.restaurants.length - a.restaurants.length);
}

type TrendingCitiesClientProps = {
  restaurants: Restaurant[];
};

export function TrendingCitiesClient({ restaurants }: TrendingCitiesClientProps) {
  const cityGroups = React.useMemo(() => groupRestaurantsByCity(restaurants), [restaurants]);

  // Filter to only show trending cities (Houston, DC, NYC, Chicago)
  const trendingCities = cityGroups.filter((group) => {
    const cityLower = group.city.toLowerCase();
    return (
      cityLower === "houston" ||
      cityLower === "washington-dc" ||
      cityLower === "new-york" ||
      cityLower === "chicago"
    );
  });

  if (trendingCities.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {trendingCities.map((cityGroup) => {
        // Get unique cuisines (up to 3) and all price ranges
        const cuisines = Array.from(new Set(cityGroup.restaurants.map((r) => r.cuisine))).slice(0, 3);
        const priceRanges = Array.from(new Set(cityGroup.restaurants.map((r) => r.price_range))).sort();

        return (
          <Reveal key={cityGroup.city}>
            <Link href={`/restaurants?city=${encodeURIComponent(cityGroup.displayName)}`} className="block">
              <Card className="group h-full transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{cityGroup.displayName}</CardTitle>
                  <CardDescription>
                    {cityGroup.restaurants.length} {cityGroup.restaurants.length === 1 ? "restaurant" : "restaurants"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {cuisines.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="text-xs">
                        {cuisine}
                      </Badge>
                    ))}
                    {cityGroup.restaurants.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{cityGroup.restaurants.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Price range:</span>
                    <span className="font-medium">{priceRanges.join(", ")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
