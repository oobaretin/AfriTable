import { HOMEPAGE_CITY_LIMIT } from "@/lib/trending-cities";
import type { JSONRestaurant } from "@/lib/restaurant-json-loader";

export type TrendingCityRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  region: string;
  price_range: string;
  rating: number;
  address: string;
};

export type TrendingCityGroup = {
  city: string;
  displayName: string;
  restaurants: TrendingCityRestaurant[];
};

function extractCity(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const cityState = parts[1];
    const cityMatch = cityState.match(/^([^,]+)/);
    return cityMatch ? cityMatch[1].trim() : cityState;
  }
  return "";
}

function normalizeCity(city: string): { key: string; display: string } {
  const lower = city.toLowerCase();

  if (lower.includes("washington") || lower.includes("dc") || lower.includes("takoma park") || lower.includes("bethesda") || lower.includes("falls church")) {
    return { key: "washington-dc", display: "Washington, DC" };
  }
  if (lower.includes("new york") || lower.includes("nyc") || lower.includes("brooklyn") || lower.includes("manhattan") || lower.includes("flushing")) {
    return { key: "new-york", display: "New York, NY" };
  }
  if (lower.includes("katy") || lower.includes("meadows place")) {
    return { key: "houston", display: "Houston, TX" };
  }
  if (lower.includes("houston")) {
    return { key: "houston", display: "Houston, TX" };
  }
  if (lower.includes("richardson") || (lower.includes("arlington") && !lower.includes("virginia"))) {
    return { key: "dallas", display: "Dallas, TX" };
  }
  if (lower.includes("dallas")) {
    return { key: "dallas", display: "Dallas, TX" };
  }
  if (lower.includes("chicago")) {
    return { key: "chicago", display: "Chicago, IL" };
  }
  if (lower.includes("atlanta") || lower.includes("peachtree corners")) {
    return { key: "atlanta", display: "Atlanta, GA" };
  }
  if (lower.includes("miami")) {
    return { key: "miami", display: "Miami, FL" };
  }
  if (lower.includes("los angeles") || lower.includes("inglewood") || lower.includes("north hollywood")) {
    return { key: "los-angeles", display: "Los Angeles, CA" };
  }
  if (lower.includes("philadelphia")) {
    return { key: "philadelphia", display: "Philadelphia, PA" };
  }
  if (lower.includes("seattle")) {
    return { key: "seattle", display: "Seattle, WA" };
  }
  if (lower.includes("boston")) {
    return { key: "boston", display: "Boston, MA" };
  }
  if (lower.includes("denver")) {
    return { key: "denver", display: "Denver, CO" };
  }
  if (lower.includes("austin") || lower.includes("pflugerville")) {
    return { key: "austin", display: "Austin, TX" };
  }
  if (lower.includes("san francisco")) {
    return { key: "san-francisco", display: "San Francisco, CA" };
  }
  if (lower.includes("oakland")) {
    return { key: "oakland", display: "Oakland, CA" };
  }
  if (lower.includes("minneapolis")) {
    return { key: "minneapolis", display: "Minneapolis, MN" };
  }
  if (lower.includes("portland")) {
    return { key: "portland", display: "Portland, OR" };
  }
  if (lower.includes("detroit")) {
    return { key: "detroit", display: "Detroit, MI" };
  }
  if (lower.includes("nashville")) {
    return { key: "nashville", display: "Nashville, TN" };
  }
  if (lower.includes("charleston")) {
    return { key: "charleston", display: "Charleston, SC" };
  }
  if (lower.includes("san antonio")) {
    return { key: "san-antonio", display: "San Antonio, TX" };
  }
  if (lower.includes("new orleans")) {
    return { key: "new-orleans", display: "New Orleans, LA" };
  }

  return { key: city.toLowerCase().replace(/\s+/g, "-"), display: city };
}

function toTrendingCityRestaurant(r: JSONRestaurant): TrendingCityRestaurant {
  return {
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    region: r.region,
    price_range: r.price_range,
    rating: r.rating,
    address: r.address,
  };
}

function groupRestaurantsByCity(restaurants: JSONRestaurant[]): TrendingCityGroup[] {
  const cityMap = new Map<string, TrendingCityRestaurant[]>();

  for (const restaurant of restaurants) {
    const city = extractCity(restaurant.address);
    if (!city) continue;

    const normalized = normalizeCity(city);

    if (!cityMap.has(normalized.key)) {
      cityMap.set(normalized.key, []);
    }
    cityMap.get(normalized.key)!.push(toTrendingCityRestaurant(restaurant));
  }

  return Array.from(cityMap.entries())
    .map(([cityKey, cityRestaurants]) => {
      const firstCity = extractCity(cityRestaurants[0]?.address || "");
      const normalized = normalizeCity(firstCity);
      return {
        city: cityKey,
        displayName: normalized.display,
        restaurants: cityRestaurants,
      };
    })
    .filter((group) => group.restaurants.length > 0)
    .sort((a, b) => b.restaurants.length - a.restaurants.length);
}

export function buildTrendingCityGroups(
  restaurants: JSONRestaurant[],
  featuredCityKeys: string[],
  limit = HOMEPAGE_CITY_LIMIT,
): TrendingCityGroup[] {
  const groups = groupRestaurantsByCity(restaurants);
  const seen = new Set<string>();
  const featured: TrendingCityGroup[] = [];

  for (const key of featuredCityKeys) {
    const group = groups.find((g) => g.city === key);
    if (group && !seen.has(group.city)) {
      featured.push(group);
      seen.add(group.city);
    }
  }

  const remainder = groups.filter((g) => !seen.has(g.city));
  return [...featured, ...remainder].slice(0, limit);
}
