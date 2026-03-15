import "server-only";
import * as fs from "node:fs";
import * as path from "node:path";

export type JSONRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  region: string;
  price_range: string;
  rating: number;
  address: string;
  phone?: string;
  website?: string;
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
};

export function loadRestaurantsFromJSON(): JSONRestaurant[] {
  try {
    const filePath = path.join(process.cwd(), "data", "restaurants.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("[RestaurantJSONLoader] Error loading restaurants.json:", error);
  }
  return [];
}

export function getRestaurantByIdFromJSON(id: string): JSONRestaurant | null {
  const restaurants = loadRestaurantsFromJSON();
  return restaurants.find((r) => r.id === id) || null;
}

/**
 * Get up to 6 similar restaurants from JSON by cuisine/region match, excluding current id.
 * Used when Supabase similar list is empty (e.g. app uses JSON as source of truth).
 */
export function getSimilarRestaurantsFromJSON(
  currentId: string,
  cuisineTypes: string[],
  limit = 6
): JSONRestaurant[] {
  const all = loadRestaurantsFromJSON();
  const rest = all.filter((r) => r.id && r.id !== currentId);
  if (rest.length === 0) return [];

  const lower = (s: string) => (s || "").toLowerCase();
  const cuisineSet = new Set((cuisineTypes || []).map(lower));

  const matching =
    cuisineSet.size > 0
      ? rest.filter((r) => {
          const c = lower(r.cuisine || "");
          const reg = lower(r.region || "");
          return (
            cuisineSet.has(c) ||
            cuisineSet.has(reg) ||
            [...cuisineSet].some((t) => c.includes(t) || reg.includes(t))
          );
        })
      : rest;

  const byRating = [...matching].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return byRating.slice(0, limit);
}
