import "server-only";

import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";
import { transformJSONRestaurantToDetail } from "@/lib/restaurant-json-loader";
import { extractCityFromAddress, matchesCity } from "@/lib/restaurant-list-filters";
import { cityFromUrlToDisplay } from "@/lib/hero-city";

export type CityRestaurantCard = {
  id: string;
  slug: string;
  name: string;
  cuisine_types: string[];
  price_range: number;
  address: unknown;
  images: string[];
  created_at: string;
  avg_rating: number | null;
  review_count: number;
};

function toCard(row: ReturnType<typeof transformJSONRestaurantToDetail>): CityRestaurantCard {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    name: row.name,
    cuisine_types: row.cuisine_types ?? [],
    price_range: row.price_range ?? 2,
    address: row.address,
    images: row.images ?? [],
    created_at: row.created_at ?? new Date(0).toISOString(),
    avg_rating: row.avg_rating ?? row.rating ?? null,
    review_count: row.review_count ?? 0,
  };
}

/** Catalog listings for a city slug (e.g. houston, new-york). */
export function getCatalogRestaurantsForCity(citySlug: string): CityRestaurantCard[] {
  const selectedCity = cityFromUrlToDisplay(citySlug.replace(/-/g, " "));
  if (!selectedCity) return [];

  const rows = loadRestaurantsFromJSON()
    .filter((r) => matchesCity(extractCityFromAddress(r.address), selectedCity))
    .map((r) => transformJSONRestaurantToDetail(r))
    .map(toCard);

  rows.sort((a, b) => {
    const ar = a.avg_rating ?? 0;
    const br = b.avg_rating ?? 0;
    if (br !== ar) return br - ar;
    return String(b.created_at).localeCompare(String(a.created_at));
  });

  return rows;
}
