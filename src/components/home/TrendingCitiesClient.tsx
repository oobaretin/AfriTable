"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/layout/Reveal";
import {
  buildRestaurantsDirectoryHref,
  filtersFromCityLabel,
} from "@/lib/restaurant-filter-url";
import type { TrendingCityGroup } from "@/lib/trending-cities-groups";

type TrendingCitiesClientProps = {
  cityGroups: TrendingCityGroup[];
};

export function TrendingCitiesClient({ cityGroups }: TrendingCitiesClientProps) {
  if (cityGroups.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cityGroups.map((cityGroup) => {
        const cuisines = Array.from(new Set(cityGroup.restaurants.map((r) => r.cuisine))).slice(0, 3);
        const cuisineCount = new Set(cityGroup.restaurants.map((r) => r.cuisine)).size;
        const priceRanges = Array.from(new Set(cityGroup.restaurants.map((r) => r.price_range))).sort();
        const listingCount = cityGroup.restaurants.length;
        const extraCuisines = Math.max(0, cuisineCount - cuisines.length);

        return (
          <Reveal key={cityGroup.city}>
            <Link
              href={buildRestaurantsDirectoryHref(filtersFromCityLabel(cityGroup.displayName))}
              className="block"
            >
              <Card className="group h-full transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{cityGroup.displayName}</CardTitle>
                  <CardDescription>
                    {listingCount} {listingCount === 1 ? "listing" : "listings"}
                    {cuisineCount > 0 ? ` · ${cuisineCount} ${cuisineCount === 1 ? "cuisine" : "cuisines"}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {cuisines.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="text-xs">
                        {cuisine}
                      </Badge>
                    ))}
                    {extraCuisines > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        +{extraCuisines} cuisines
                      </Badge>
                    ) : null}
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
