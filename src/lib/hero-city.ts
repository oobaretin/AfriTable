/**
 * City labels for hero search, URL params, CityFilter, and RestaurantGrid.matchesCity.
 * Keep in sync with CityFilter.tsx and RestaurantGrid.tsx metro branches.
 */
export const HERO_FILTER_CITIES = [
  "NYC",
  "Houston",
  "Atlanta",
  "DC",
  "Miami",
  "Chicago",
  "LA",
  "Dallas",
  "Philadelphia",
  "Seattle",
  "Boston",
  "Denver",
  "Austin",
  "San Francisco",
  "Oakland",
  "Minneapolis",
  "Portland",
  "Detroit",
  "Nashville",
  "Charleston",
  "San Antonio",
  "New Orleans",
] as const;

export type HeroFilterCity = (typeof HERO_FILTER_CITIES)[number];

const CITY_ALIAS_TO_FILTER: Record<string, HeroFilterCity> = {
  nyc: "NYC",
  "new york": "NYC",
  "new york city": "NYC",
  brooklyn: "NYC",
  manhattan: "NYC",
  dc: "DC",
  washington: "DC",
  "washington d.c": "DC",
  "washington d.c.": "DC",
  "washington dc": "DC",
  la: "LA",
  "los angeles": "LA",
  philly: "Philadelphia",
  philadelphia: "Philadelphia",
  houston: "Houston",
  atlanta: "Atlanta",
  miami: "Miami",
  chicago: "Chicago",
  seattle: "Seattle",
  "new orleans": "New Orleans",
  dallas: "Dallas",
  boston: "Boston",
  denver: "Denver",
  austin: "Austin",
  "san francisco": "San Francisco",
  oakland: "Oakland",
  minneapolis: "Minneapolis",
  portland: "Portland",
  detroit: "Detroit",
  nashville: "Nashville",
  charleston: "Charleston",
  "san antonio": "San Antonio",
};

/** Primary city token from filter label or `City, ST` URL values. */
export function primaryCityToken(selected: string): string {
  const s = selected.trim().toLowerCase();
  if (!s) return "";
  return s.split(",")[0].trim();
}

/** Map URL `?city=` values to CityFilter labels. */
export function cityFromUrlToDisplay(urlCity: string): string {
  const raw = urlCity.trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const first = lower.split(",")[0].trim();

  const alias = CITY_ALIAS_TO_FILTER[first];
  if (alias) return alias;

  const direct = HERO_FILTER_CITIES.find((c) => c.toLowerCase() === first);
  if (direct) return direct;

  return raw.split(",")[0].trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isKnownHeroCity(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const mapped = cityFromUrlToDisplay(trimmed);
  return HERO_FILTER_CITIES.includes(mapped as HeroFilterCity);
}

/** Resolve hero input to a canonical filter city label, or null if not a known city. */
export function normalizeCityForSearch(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!isKnownHeroCity(trimmed)) return null;
  return cityFromUrlToDisplay(trimmed);
}

export function filterCitySuggestions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return HERO_FILTER_CITIES.filter((c) => c.toLowerCase().includes(q));
}
