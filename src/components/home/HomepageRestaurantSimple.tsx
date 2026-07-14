"use client";

import { RestaurantResults } from "./RestaurantResults";
import type { CatalogListItem } from "@/lib/catalog-list-item";

type HomepageRestaurantSimpleProps = {
  spotlight: CatalogListItem[];
};

export function HomepageRestaurantSimple({ spotlight }: HomepageRestaurantSimpleProps) {
  const results = spotlight.map((restaurant) => ({ restaurant, distance: null }));
  return <RestaurantResults restaurants={results} />;
}
