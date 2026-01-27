/**
 * Example usage of the RestaurantDetail component
 * 
 * This file demonstrates how to use the RestaurantDetail component
 * with data from restaurants.json
 */

import { RestaurantDetail } from "./RestaurantDetail";
import type { RestaurantDetailData } from "./RestaurantDetail";

// Example: Using the component with data from restaurants.json
export function RestaurantDetailExample() {
  // Example restaurant data matching the restaurants.json structure
  const exampleRestaurant: RestaurantDetailData = {
    id: "chez-michelle",
    name: "Chez Michelle Restaurant",
    cuisine: "Cameroonian",
    region: "West African",
    price_range: "$$",
    rating: 4.5,
    address: "6991 S Texas 6, Houston, TX 77083",
    phone: "(281) 372-8925",
    website: "https://chezmichellerestaurant.com",
    social: {
      instagram: "@chezmichelle_houston",
      facebook: "Chez Michelle",
    },
    hours: {
      mon_sat: "12:00 PM - 12:00 AM",
      sun: "12:00 PM - 10:00 PM",
    },
    about: "Authentic African cuisine with a focus on bringing people together. Perfect for late-night Ndole soup.",
    our_story: "We are passionate about sharing the rich flavors and warm hospitality that define African dining using traditional recipes and fresh ingredients.",
    cultural_roots: "Food in African culture is a way of expressing love and preserving generations of traditions.",
    menu_highlights: ["Ndole Soup", "Grilled Tilapia", "Eru"],
    images: [], // Add image URLs here if available
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <RestaurantDetail restaurant={exampleRestaurant} />
    </div>
  );
}

/**
 * Example: Loading restaurant data from restaurants.json
 * 
 * In a Next.js page or component:
 * 
 * ```tsx
 * import { RestaurantDetail } from "@/components/restaurant/RestaurantDetail";
 * import restaurantsData from "@/data/restaurants.json";
 * 
 * export default function RestaurantPage({ params }: { params: { id: string } }) {
 *   const restaurant = restaurantsData.find((r) => r.id === params.id);
 *   
 *   if (!restaurant) {
 *     return <div>Restaurant not found</div>;
 *   }
 * 
 *   return (
 *     <div className="container mx-auto px-4 py-8">
 *       <RestaurantDetail restaurant={restaurant} />
 *     </div>
 *   );
 * }
 * ```
 */
