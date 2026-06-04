/** Map pulse / config city labels to trending city keys (matches TrendingCitiesClient grouping). */
export function pulseCityToKey(city: string): string {
  const lower = city.toLowerCase();

  if (lower.includes("houston")) return "houston";
  if (lower.includes("miami")) return "miami";
  if (lower.includes("dallas")) return "dallas";
  if (lower.includes("atlanta")) return "atlanta";
  if (lower.includes("chicago")) return "chicago";
  if (lower.includes("new york") || lower === "nyc") return "new-york";
  if (lower.includes("washington") || lower.includes("dc")) return "washington-dc";
  if (lower.includes("los angeles")) return "los-angeles";
  if (lower.includes("philadelphia")) return "philadelphia";
  if (lower.includes("seattle")) return "seattle";
  if (lower.includes("boston")) return "boston";
  if (lower.includes("austin")) return "austin";
  if (lower.includes("san francisco")) return "san-francisco";

  return lower.replace(/\s+/g, "-");
}

export const HOMEPAGE_CITY_LIMIT = 6;
