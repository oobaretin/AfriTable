import { primaryCityToken } from "@/lib/hero-city";

/** Extract city token from catalog address string. */
export function extractCityFromAddress(address: string | unknown): string {
  if (typeof address === "string") {
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const cityMatch = parts[1].match(/^([^,]+)/);
      return cityMatch ? cityMatch[1].trim().toLowerCase() : "";
    }
  }
  return "";
}

export function matchesCity(restaurantCity: string, selectedCity: string): boolean {
  const cityLower = primaryCityToken(selectedCity);
  if (!cityLower) return true;
  const restaurantCityLower = restaurantCity.toLowerCase();

  if (cityLower === "nyc" || cityLower === "new york" || cityLower === "new york city") {
    return (
      restaurantCityLower.includes("new york") ||
      restaurantCityLower.includes("brooklyn") ||
      restaurantCityLower.includes("manhattan") ||
      restaurantCityLower.includes("queens") ||
      restaurantCityLower.includes("bronx") ||
      restaurantCityLower.includes("flushing")
    );
  }
  if (cityLower === "dc" || cityLower === "washington") {
    return (
      restaurantCityLower.includes("washington") ||
      restaurantCityLower.includes("dc") ||
      restaurantCityLower.includes("bethesda") ||
      restaurantCityLower.includes("takoma park") ||
      restaurantCityLower.includes("falls church")
    );
  }
  if (cityLower === "la" || cityLower === "los angeles") {
    return (
      restaurantCityLower.includes("los angeles") ||
      restaurantCityLower.includes("inglewood") ||
      restaurantCityLower.includes("north hollywood")
    );
  }
  if (cityLower === "philadelphia" || cityLower === "philly") {
    return restaurantCityLower.includes("philadelphia") || restaurantCityLower.includes("philly");
  }
  if (cityLower === "dallas") {
    return (
      restaurantCityLower.includes("dallas") ||
      restaurantCityLower.includes("richardson") ||
      restaurantCityLower.includes("arlington")
    );
  }
  if (cityLower === "houston") {
    return (
      restaurantCityLower.includes("houston") ||
      restaurantCityLower.includes("katy") ||
      restaurantCityLower.includes("meadows place") ||
      restaurantCityLower.includes("richmond")
    );
  }
  if (cityLower === "miami") {
    return restaurantCityLower.includes("miami");
  }
  if (cityLower === "atlanta") {
    return restaurantCityLower.includes("atlanta") || restaurantCityLower.includes("peachtree corners");
  }
  if (cityLower === "boston") {
    return restaurantCityLower.includes("boston");
  }
  if (cityLower === "seattle") {
    return restaurantCityLower.includes("seattle");
  }
  if (cityLower === "new orleans") {
    return restaurantCityLower.includes("new orleans");
  }
  if (cityLower === "denver") {
    return restaurantCityLower.includes("denver");
  }
  if (cityLower === "austin") {
    return restaurantCityLower.includes("austin") || restaurantCityLower.includes("pflugerville");
  }
  if (cityLower === "san francisco") {
    return restaurantCityLower.includes("san francisco");
  }
  if (cityLower === "oakland") {
    return restaurantCityLower.includes("oakland");
  }
  if (cityLower === "minneapolis") {
    return restaurantCityLower.includes("minneapolis");
  }
  if (cityLower === "portland") {
    return restaurantCityLower.includes("portland");
  }
  if (cityLower === "detroit") {
    return restaurantCityLower.includes("detroit");
  }
  if (cityLower === "nashville") {
    return restaurantCityLower.includes("nashville");
  }
  if (cityLower === "charleston") {
    return restaurantCityLower.includes("charleston");
  }
  if (cityLower === "san antonio") {
    return restaurantCityLower.includes("san antonio");
  }
  if (cityLower === "chicago") {
    return restaurantCityLower.includes("chicago");
  }

  return restaurantCityLower.includes(cityLower) || cityLower.includes(restaurantCityLower);
}

/** Cuisine chip → tokens matched against cuisine + region fields. */
const CUISINE_CHIP_TOKENS: Record<string, string[]> = {
  African: ["african"],
  Caribbean: [
    "caribbean",
    "jamaican",
    "haitian",
    "trinidadian",
    "southern-caribbean",
    "caribbean fusion",
    "caribbean & soul",
    "modern caribbean",
    "afro-caribbean",
  ],
  Nigerian: ["nigerian"],
  Ethiopian: ["ethiopian"],
  Jamaican: ["jamaican"],
  Haitian: ["haitian"],
  Ghanaian: ["ghanaian"],
  Senegalese: ["senegalese"],
  Kenyan: ["kenyan"],
  Somali: ["somali"],
  Eritrean: ["eritrean"],
};

export function matchesCuisineChip(
  cuisine: string,
  region: string,
  chip: string,
): boolean {
  if (chip === "All") return true;
  const c = cuisine.toLowerCase();
  const r = region.toLowerCase();

  if (chip === "African") {
    return c === "african" || r === "african";
  }

  const tokens = CUISINE_CHIP_TOKENS[chip];
  if (tokens) {
    return tokens.some((t) => c.includes(t) || r.includes(t));
  }
  const chipLower = chip.toLowerCase();
  return c === chipLower || c.includes(chipLower) || r.includes(chipLower);
}

export type VibeFilterOption =
  | "All"
  | "Fine Dining"
  | "Authentic Staples"
  | "Community Favorites"
  | "Daily Driver";

export function filterByVibe<T extends { vibe_category?: string; vibe?: string }>(
  restaurants: T[],
  vibe: VibeFilterOption,
): T[] {
  if (vibe === "All") {
    return restaurants;
  }

  return restaurants.filter((restaurant) => {
    if (vibe === "Fine Dining" && restaurant.vibe_category === "Fine Dining") {
      return true;
    }
    if (vibe === "Authentic Staples" && restaurant.vibe_category === "Authentic Staples") {
      return true;
    }
    if (vibe === "Community Favorites" && restaurant.vibe_category === "Community Favorites") {
      return true;
    }
    if (vibe === "Daily Driver") {
      return (restaurant.vibe?.toLowerCase() || "").includes("daily driver");
    }
    return false;
  });
}

export type ListFilterParams = {
  activeCategory: string;
  activeCity: string;
  nameQuery: string;
};

export function filterRestaurantList<T extends { name?: string; cuisine?: string; region?: string; address?: unknown }>(
  restaurants: T[],
  { activeCategory, activeCity, nameQuery }: ListFilterParams,
): T[] {
  let filtered = [...restaurants];

  if (nameQuery) {
    filtered = filtered.filter((r) => {
      const name = r.name?.toLowerCase() || "";
      const cuisine = r.cuisine?.toLowerCase() || "";
      const restaurantCity = extractCityFromAddress(r.address);
      return (
        name.includes(nameQuery) ||
        cuisine.includes(nameQuery) ||
        restaurantCity.includes(nameQuery)
      );
    });
  }

  if (activeCity) {
    filtered = filtered.filter((r) =>
      matchesCity(extractCityFromAddress(r.address), activeCity),
    );
  }

  if (activeCategory !== "All") {
    filtered = filtered.filter((r) =>
      matchesCuisineChip(r.cuisine || "", r.region || "", activeCategory),
    );
  }

  return filtered;
}
