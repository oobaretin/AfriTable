import type { JSONRestaurant } from "@/lib/restaurant-json-loader-server";

function extractCity(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const cityState = parts[1];
    const cityMatch = cityState.match(/^([^,]+)/);
    return cityMatch ? cityMatch[1].trim() : cityState;
  }
  return "";
}

function metroKey(city: string): string {
  const lower = city.toLowerCase();

  if (lower.includes("washington") || lower.includes("dc")) return "washington-dc";
  if (lower.includes("new york") || lower.includes("nyc") || lower.includes("brooklyn")) return "new-york";
  if (lower.includes("houston") || lower.includes("katy")) return "houston";
  if (lower.includes("dallas") || lower.includes("richardson")) return "dallas";
  if (lower.includes("chicago")) return "chicago";
  if (lower.includes("atlanta")) return "atlanta";
  if (lower.includes("miami")) return "miami";
  if (lower.includes("los angeles") || lower.includes("inglewood")) return "los-angeles";
  if (lower.includes("philadelphia")) return "philadelphia";
  if (lower.includes("seattle")) return "seattle";
  if (lower.includes("boston")) return "boston";
  if (lower.includes("austin")) return "austin";
  if (lower.includes("san francisco") || lower.includes("oakland")) return "san-francisco";

  return lower.replace(/\s+/g, "-");
}

export type CatalogStats = {
  restaurantCount: number;
  metroCount: number;
};

export function getCatalogStats(restaurants: JSONRestaurant[]): CatalogStats {
  const metros = new Set<string>();

  for (const restaurant of restaurants) {
    const city = extractCity(restaurant.address);
    if (city) metros.add(metroKey(city));
  }

  return {
    restaurantCount: restaurants.length,
    metroCount: metros.size,
  };
}
