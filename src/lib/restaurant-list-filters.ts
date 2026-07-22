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

/** Strip accents so "chopnblok" matches "ChòpnBlọk". */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Compact alphanumeric form for fuzzy name / domain matching (e.g. reggaehut → Reggae Hut Cafe). */
export function compactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/[^a-z0-9]/g, "");
}

/** Drop parenthetical location suffixes for brand-level matching (e.g. "ChòpnBlọk (Montrose)" → "ChòpnBlọk"). */
function brandNameForSearch(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

const SEARCH_STOP_WORDS = new Set([
  "restaurant",
  "restaurants",
  "cafe",
  "kitchen",
  "inc",
  "llc",
  "the",
  "and",
]);

function significantSearchTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !SEARCH_STOP_WORDS.has(t));
}

/** True when query and text share enough tokens (handles long queries like "Chef Creole Seasoned Restaurant"). */
function tokensMatchQuery(query: string, text: string): boolean {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(text);
  const textTokens = significantSearchTokens(text);
  const queryTokens = significantSearchTokens(query);

  if (textTokens.length > 0 && textTokens.every((token) => q.includes(normalizeSearchText(token)))) {
    return true;
  }
  if (queryTokens.length > 0 && queryTokens.every((token) => t.includes(normalizeSearchText(token)))) {
    return true;
  }
  return false;
}

type NameSearchable = {
  id?: string;
  name?: string;
  cuisine?: string;
  region?: string;
  address?: unknown;
  website?: string;
  about?: string;
  search_aliases?: string[];
};

export function matchesNameQuery(restaurant: NameSearchable, nameQuery: string): boolean {
  const q = nameQuery.trim().toLowerCase();
  if (!q) return true;

  const qNorm = normalizeSearchText(q);
  const qCompact = compactSearchText(q);
  const restaurantCity = extractCityFromAddress(restaurant.address);
  const brandName = restaurant.name ? brandNameForSearch(restaurant.name) : "";

  const haystacks = [
    restaurant.name,
    brandName,
    restaurant.cuisine,
    restaurant.region,
    restaurant.website,
    restaurant.about,
    restaurantCity,
    ...(restaurant.search_aliases ?? []),
  ]
    .filter(Boolean)
    .map((s) => String(s));

  const matched = haystacks.some((text) => {
    const lower = text.toLowerCase();
    const normalized = normalizeSearchText(text);
    if (lower.includes(q) || normalized.includes(qNorm)) return true;
    if (brandName && tokensMatchQuery(q, brandName)) return true;
    if (tokensMatchQuery(q, text)) return true;
    if (qCompact.length >= 3 && compactSearchText(text).includes(qCompact)) return true;
    if (qCompact.length >= 3 && compactSearchText(text).length >= 3 && qCompact.includes(compactSearchText(text))) {
      return true;
    }
    return false;
  });

  return matched;
}

export type ListFilterParams = {
  activeCategory: string;
  activeCity: string;
  nameQuery: string;
};

export function filterRestaurantList<T extends NameSearchable>(
  restaurants: T[],
  { activeCategory, activeCity, nameQuery }: ListFilterParams,
): T[] {
  let filtered = [...restaurants];

  if (nameQuery) {
    filtered = filtered.filter((r) => matchesNameQuery(r, nameQuery));
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
