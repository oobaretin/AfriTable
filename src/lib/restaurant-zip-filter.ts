import type { JSONRestaurant } from "@/lib/restaurant-json-loader";
import { calculateDistance, getZipCodeCoordinates } from "@/lib/geocoding";

export type ZipFilteredRestaurant = {
  restaurant: JSONRestaurant;
  distance: number;
};

export function getRestaurantZipCode(restaurant: JSONRestaurant): string | null {
  if (restaurant.zip) {
    return restaurant.zip;
  }
  if (typeof restaurant.address === "string") {
    const zipMatch = restaurant.address.match(/\b(\d{5})\b/);
    return zipMatch ? zipMatch[1] : null;
  }
  return null;
}

export function getRestaurantCoordinates(
  restaurant: JSONRestaurant,
): { lat: number; lng: number } | null {
  if (restaurant.lat !== undefined && restaurant.lng !== undefined) {
    return { lat: restaurant.lat, lng: restaurant.lng };
  }
  const zip = getRestaurantZipCode(restaurant);
  if (zip) {
    return getZipCodeCoordinates(zip);
  }
  return null;
}

/** Filter catalog by zip centroid + radius (miles), sorted nearest first. */
export function filterRestaurantsByZip(
  restaurants: JSONRestaurant[],
  zipCode: string,
  radiusMiles: number,
): ZipFilteredRestaurant[] {
  if (zipCode.length !== 5) {
    return [];
  }

  const userCoords = getZipCodeCoordinates(zipCode);

  if (!userCoords) {
    return restaurants
      .filter((restaurant) => getRestaurantZipCode(restaurant) === zipCode)
      .map((restaurant) => ({ restaurant, distance: 0 }));
  }

  return restaurants
    .map((restaurant) => {
      const restaurantCoords = getRestaurantCoordinates(restaurant);
      if (!restaurantCoords) {
        if (getRestaurantZipCode(restaurant) === zipCode) {
          return { restaurant, distance: 0 };
        }
        return null;
      }

      const distance = calculateDistance(
        userCoords.lat,
        userCoords.lng,
        restaurantCoords.lat,
        restaurantCoords.lng,
      );

      return { restaurant, distance };
    })
    .filter((item): item is ZipFilteredRestaurant => {
      if (!item) return false;
      return item.distance <= radiusMiles;
    })
    .sort((a, b) => a.distance - b.distance);
}
