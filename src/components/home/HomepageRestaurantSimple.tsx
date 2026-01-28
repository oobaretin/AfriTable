"use client";

import * as React from "react";
import { RestaurantResults } from "./RestaurantResults";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

type RestaurantWithDistance = {
  restaurant: JSONRestaurant;
  distance: number | null;
};

type HomepageRestaurantSimpleProps = {
  restaurants: JSONRestaurant[];
};

export function HomepageRestaurantSimple({ restaurants }: HomepageRestaurantSimpleProps) {
  // Show featured restaurants on homepage (no search/filter)
  const featuredRestaurants: RestaurantWithDistance[] = React.useMemo(() => {
    const featured = restaurants
      .filter((r) => r.price_range === "$$$")
      .slice(0, 4)
      .map((r) => ({ restaurant: r, distance: null }));
    return featured;
  }, [restaurants]);

  return <RestaurantResults restaurants={featuredRestaurants} />;
}
