import type { JSONRestaurant } from "@/lib/restaurant-json-loader";
import { rankRestaurantImages } from "@/lib/restaurant-image";
import {
  evaluateCatalogTrust,
  isWeakAbout,
  resolveGuestSpecialty,
  type CatalogTrustLevel,
} from "@/lib/catalog-trust";

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
  hours?: JSONRestaurant["hours"];
  trust_level?: CatalogTrustLevel;
};

const ABOUT_SNIPPET_MAX = 160;

export function toCatalogListItem(restaurant: JSONRestaurant): CatalogListItem {
  const aboutRaw = String(restaurant.about || "").trim();
  const about = aboutRaw && !isWeakAbout(aboutRaw) ? aboutRaw.slice(0, ABOUT_SNIPPET_MAX) : undefined;
  const ranked = rankRestaurantImages(restaurant.images);
  const specialty = resolveGuestSpecialty(restaurant.specialty, restaurant.menu_highlights) ?? undefined;
  const trust = evaluateCatalogTrust({
    phone: restaurant.phone,
    website: restaurant.website,
    hours: restaurant.hours,
    images: restaurant.images,
    about: restaurant.about,
    our_story: restaurant.our_story,
    specialty: restaurant.specialty,
    menu_highlights: restaurant.menu_highlights,
    address: restaurant.address,
    google_place_id: (restaurant as { google_place_id?: string }).google_place_id,
  });

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
    // Prefer ranked venue photo for cards (not Street View when alternatives exist)
    images: ranked.length ? [ranked[0]] : restaurant.images?.length ? [restaurant.images[0]] : undefined,
    vibe_tags: restaurant.vibe_tags,
    vibe_category: restaurant.vibe_category,
    vibe: restaurant.vibe,
    featured: restaurant.featured,
    search_aliases: restaurant.search_aliases,
    neighborhood: restaurant.neighborhood,
    specialty,
    menu_highlights: specialty ? [specialty] : undefined,
    awards: restaurant.awards,
    about,
    hours: restaurant.hours,
    trust_level: trust.level,
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

/** Homepage spotlight: prefer vetted (venue photos + contact), geographic spread, top-rated. */
export function pickHomepageSpotlight(restaurants: JSONRestaurant[], limit = 6): CatalogListItem[] {
  if (!restaurants.length) return [];

  const withTrust = restaurants.map((r) => ({
    r,
    trust: evaluateCatalogTrust({
      phone: r.phone,
      website: r.website,
      hours: r.hours,
      images: r.images,
      about: r.about,
      our_story: r.our_story,
      specialty: r.specialty,
      menu_highlights: r.menu_highlights,
      address: r.address,
      google_place_id: (r as { google_place_id?: string }).google_place_id,
    }),
  }));

  const sorted = [...withTrust].sort((a, b) => {
    if (a.trust.level !== b.trust.level) return a.trust.level === "vetted" ? -1 : 1;
    if (b.trust.score !== a.trust.score) return b.trust.score - a.trust.score;
    return (b.r.rating || 0) - (a.r.rating || 0);
  });

  const out: JSONRestaurant[] = [];
  const usedStates = new Set<string>();
  const usedIds = new Set<string>();

  for (const { r } of sorted) {
    if (out.length >= limit) break;
    const st = extractStateFromAddress(r.address);
    if (st && !usedStates.has(st)) {
      usedStates.add(st);
      usedIds.add(r.id);
      out.push(r);
    }
  }

  for (const { r } of sorted) {
    if (out.length >= limit) break;
    if (usedIds.has(r.id)) continue;
    out.push(r);
    usedIds.add(r.id);
  }

  return out.slice(0, limit).map(toCatalogListItem);
}
