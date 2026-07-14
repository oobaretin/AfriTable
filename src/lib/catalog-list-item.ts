import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

/** Slim catalog row for homepage/directory client bundles (no hours, stories, or full about text). */
export type CatalogListItem = {
  id: string;
  name: string;
  cuisine: string;
  region: string;
  price_range: string;
  rating: number;
  address: string;
  zip?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  images?: string[];
  vibe_tags?: string[];
  vibe_category?: JSONRestaurant["vibe_category"];
  vibe?: string;
  featured?: boolean;
  search_aliases?: string[];
  neighborhood?: string;
  specialty?: string;
  menu_highlights?: string[];
  awards?: string[];
  /** Truncated for client-side search only */
  about?: string;
};

const ABOUT_SNIPPET_MAX = 160;

export function toCatalogListItem(restaurant: JSONRestaurant): CatalogListItem {
  const about = String(restaurant.about || "").trim();
  return {
    id: restaurant.id,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    region: restaurant.region,
    price_range: restaurant.price_range,
    rating: restaurant.rating,
    address: restaurant.address,
    zip: restaurant.zip,
    lat: restaurant.lat,
    lng: restaurant.lng,
    phone: restaurant.phone,
    website: restaurant.website,
    images: restaurant.images?.length ? [restaurant.images[0]] : undefined,
    vibe_tags: restaurant.vibe_tags,
    vibe_category: restaurant.vibe_category,
    vibe: restaurant.vibe,
    featured: restaurant.featured,
    search_aliases: restaurant.search_aliases,
    neighborhood: restaurant.neighborhood,
    specialty: restaurant.specialty,
    menu_highlights: restaurant.menu_highlights?.slice(0, 1),
    awards: restaurant.awards,
    about: about ? about.slice(0, ABOUT_SNIPPET_MAX) : undefined,
  };
}

export function toCatalogListItems(restaurants: JSONRestaurant[]): CatalogListItem[] {
  return restaurants.map(toCatalogListItem);
}

function extractStateFromAddress(address: string | undefined): string | null {
  if (!address || typeof address !== "string") return null;
  const m = address.match(/,\s*([A-Z]{2})\s+\d{5}/);
  return m ? m[1] : null;
}

/** Homepage spotlight: geographic spread across states, top-rated first. */
export function pickHomepageSpotlight(restaurants: JSONRestaurant[], limit = 6): CatalogListItem[] {
  if (!restaurants.length) return [];

  const sorted = [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const out: JSONRestaurant[] = [];
  const usedStates = new Set<string>();
  const usedIds = new Set<string>();

  for (const r of sorted) {
    if (out.length >= limit) break;
    const st = extractStateFromAddress(r.address);
    if (st && !usedStates.has(st)) {
      usedStates.add(st);
      usedIds.add(r.id);
      out.push(r);
    }
  }

  for (const r of sorted) {
    if (out.length >= limit) break;
    if (usedIds.has(r.id)) continue;
    out.push(r);
    usedIds.add(r.id);
  }

  return out.slice(0, limit).map(toCatalogListItem);
}
