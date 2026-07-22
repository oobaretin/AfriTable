// Client-safe utilities for transforming JSON restaurant data
// Server-only functions are in restaurant-json-loader-server.ts

import { parseCatalogHoursToArray } from "@/lib/parse-catalog-hours";
import { resolveGoogleSearchUrl } from "@/lib/google-search-url";
import type { CatalogListItem } from "@/lib/catalog-list-item";

export type JSONRestaurant = {
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
  google_place_id?: string;
  google_search_url?: string;
  /** @deprecated use google_search_url */
  google_maps_url?: string;
  social?: {
    instagram?: string;
    facebook?: string;
  };
  hours?: any;
  about?: string;
  our_story?: string;
  cultural_roots?: string;
  menu_highlights?: string[];
  images?: string[];
  vibe_tags?: string[];
  neighborhood?: string;
  vibe?: string;
  specialty?: string;
  awards?: string[];
  quality_factor?: string;
  featured?: boolean;
  /** Extra strings for directory search (legacy names, domains, neighborhoods). */
  search_aliases?: string[];
  vibe_category?: "Fine Dining" | "Authentic Staples" | "Community Favorites";
  secondary_location?: {
    name: string;
    address: string;
    phone: string;
    catalog_id?: string;
  };
};

// Transform JSON restaurant to RestaurantDetail format
export function transformJSONRestaurantToDetail(jsonRestaurant: CatalogListItem & Partial<JSONRestaurant>): any {
  const priceRangeMap: Record<string, number> = {
    $: 1,
    $$: 2,
    $$$: 3,
    $$$$: 4,
  };

  // Parse address string to extract city/state if needed
  let addressObj: unknown = jsonRestaurant.address;
  if (typeof jsonRestaurant.address === "string") {
    const parts = jsonRestaurant.address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const cityState = parts[1];
      const cityMatch = cityState.match(/^([^,]+)/);
      const stateMatch = cityState.match(/\b([A-Z]{2})\b/);
      addressObj = {
        street: parts[0],
        city: cityMatch ? cityMatch[1].trim() : cityState,
        state: stateMatch ? stateMatch[1] : null,
        zip: parts.length > 2 ? parts[2] : null,
      };
    } else {
      addressObj = { street: jsonRestaurant.address };
    }
  }

  // Parse hours from JSON format to array format
  const hoursArray = parseCatalogHoursToArray(jsonRestaurant.hours);

  // Extract Instagram handle from social object
  let instagramHandle: string | null = null;
  if (jsonRestaurant.social?.instagram) {
    const insta = jsonRestaurant.social.instagram;
    instagramHandle = insta.startsWith("@") ? insta.slice(1) : insta;
  }

  return {
    id: jsonRestaurant.id,
    name: jsonRestaurant.name,
    slug: jsonRestaurant.id, // Use id as slug
    cuisine_types: [jsonRestaurant.cuisine, jsonRestaurant.region].filter(Boolean),
    price_range: priceRangeMap[jsonRestaurant.price_range] || 2,
    description: jsonRestaurant.about || null,
    our_story: jsonRestaurant.our_story || null,
    cultural_roots: jsonRestaurant.cultural_roots || null,
    special_features: null,
    menu: jsonRestaurant.menu_highlights ? { highlights: jsonRestaurant.menu_highlights } : null,
    address: addressObj,
    phone: jsonRestaurant.phone || null,
    website: jsonRestaurant.website && jsonRestaurant.website !== "N/A" ? jsonRestaurant.website : null,
    google_search_url: resolveGoogleSearchUrl({
      name: jsonRestaurant.name,
      address: jsonRestaurant.address,
      google_search_url: jsonRestaurant.google_search_url,
      google_maps_url: jsonRestaurant.google_maps_url,
    }),
    instagram_handle: instagramHandle,
    facebook_url: jsonRestaurant.social?.facebook || null,
    images: jsonRestaurant.images || [],
    hours: hoursArray.length > 0 ? hoursArray : jsonRestaurant.hours || null,
    avg_rating: jsonRestaurant.rating || null,
    review_count: 0,
    vibe_tags: jsonRestaurant.vibe_tags || null,
    region: jsonRestaurant.region || null, // Include region field for color mapping
    secondary_location: jsonRestaurant.secondary_location || null,
    neighborhood: jsonRestaurant.neighborhood || null,
    vibe: jsonRestaurant.vibe || null,
    specialty: jsonRestaurant.specialty || (jsonRestaurant.menu_highlights && jsonRestaurant.menu_highlights.length > 0 ? jsonRestaurant.menu_highlights[0] : null),
    awards: jsonRestaurant.awards || null,
    quality_factor: jsonRestaurant.quality_factor || null,
    vibe_category: jsonRestaurant.vibe_category || null,
  };
}
