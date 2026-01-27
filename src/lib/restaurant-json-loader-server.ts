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
