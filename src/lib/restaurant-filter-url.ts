import { cityFromUrlToDisplay, normalizeCityForSearch } from "@/lib/hero-city";
import type { VibeFilterOption } from "@/lib/restaurant-list-filters";

export type RestaurantFilterState = {
  city: string;
  cuisine: string;
  zip: string;
  radius: number;
  vibe: VibeFilterOption;
  q: string;
};

export const DEFAULT_RESTAURANT_FILTERS: RestaurantFilterState = {
  city: "",
  cuisine: "All",
  zip: "",
  radius: 10,
  vibe: "All",
  q: "",
};

const VIBE_SLUGS: Record<string, VibeFilterOption> = {
  all: "All",
  "fine-dining": "Fine Dining",
  "authentic-staples": "Authentic Staples",
  "community-favorites": "Community Favorites",
  "daily-driver": "Daily Driver",
};

function clampRadius(value: number): number {
  if (!Number.isFinite(value)) return 10;
  const stepped = Math.round(value / 5) * 5;
  return Math.min(50, Math.max(5, stepped));
}

function parseVibe(raw: string | null): VibeFilterOption {
  if (!raw) return "All";
  const slug = raw.trim().toLowerCase();
  if (VIBE_SLUGS[slug]) return VIBE_SLUGS[slug];
  const direct = Object.values(VIBE_SLUGS).find((v) => v.toLowerCase() === slug);
  return direct ?? "All";
}

export function vibeToSlug(vibe: VibeFilterOption): string {
  switch (vibe) {
    case "Fine Dining":
      return "fine-dining";
    case "Authentic Staples":
      return "authentic-staples";
    case "Community Favorites":
      return "community-favorites";
    case "Daily Driver":
      return "daily-driver";
    default:
      return "all";
  }
}

export function parseRestaurantFiltersFromSearchParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): RestaurantFilterState {
  const city = cityFromUrlToDisplay(searchParams.get("city")?.trim() || "");
  const cuisine = searchParams.get("cuisine")?.trim() || "All";
  const zip = (searchParams.get("zip") || "").replace(/\D/g, "").slice(0, 5);
  const radius = clampRadius(Number(searchParams.get("radius") || "10"));
  const vibe = parseVibe(searchParams.get("vibe"));
  const q = searchParams.get("q")?.trim() || "";

  return { city, cuisine, zip, radius, vibe, q };
}

export function buildRestaurantFilterSearchParams(
  filters: RestaurantFilterState,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.city) {
    params.set("city", filters.city);
  }
  if (filters.cuisine && filters.cuisine !== "All") {
    params.set("cuisine", filters.cuisine);
  }
  if (filters.zip.length === 5) {
    params.set("zip", filters.zip);
    if (filters.radius !== 10) {
      params.set("radius", String(filters.radius));
    }
  }
  if (filters.vibe !== "All") {
    params.set("vibe", vibeToSlug(filters.vibe));
  }
  if (filters.q) {
    params.set("q", filters.q);
  }

  return params;
}

/** Map hero / sticky search input to directory filter params. */
export function filtersFromHeroSearchInput(input: string): Partial<RestaurantFilterState> {
  const raw = input.trim();
  if (!raw) return {};

  const city = normalizeCityForSearch(raw);
  if (city) {
    return { city };
  }

  return { q: raw };
}

/** Canonical link to `/restaurants` with optional filter query string. */
export function buildRestaurantsDirectoryHref(
  partial: Partial<RestaurantFilterState> = {},
  basePath = "/restaurants",
): string {
  const merged: RestaurantFilterState = {
    ...DEFAULT_RESTAURANT_FILTERS,
    ...partial,
  };
  const qs = buildRestaurantFilterSearchParams(merged).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Parse a city label from trending cards or legacy links into filter state. */
export function filtersFromCityLabel(label: string): Partial<RestaurantFilterState> {
  const city = cityFromUrlToDisplay(label);
  return city ? { city } : {};
}

type ReadonlyURLSearchParams = {
  get(name: string): string | null;
};
