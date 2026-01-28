// Client-safe utilities for transforming JSON restaurant data
// Server-only functions are in restaurant-json-loader-server.ts

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
  neighborhood?: string;
  vibe?: string;
  specialty?: string;
  secondary_location?: {
    name: string;
    address: string;
    phone: string;
  };
};

// Transform JSON restaurant to RestaurantDetail format
export function transformJSONRestaurantToDetail(jsonRestaurant: JSONRestaurant): any {
  const priceRangeMap: Record<string, number> = {
    $: 1,
    $$: 2,
    $$$: 3,
    $$$$: 4,
  };

  // Parse address string to extract city/state if needed
  let addressObj: unknown = jsonRestaurant.address;
  if (typeof jsonRestaurant.address === "string") {
    const parts = jsonRestaurant.address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      const cityState = parts[1];
      const cityMatch = cityState.match(/^([^,]+)/);
      const stateMatch = cityState.match(/\b([A-Z]{2})\b/);
      addressObj = {
        street: parts[0],
        city: cityMatch ? cityMatch[1].trim() : cityState,
        state: stateMatch ? stateMatch[1] : null,
        zip: parts.length > 2 ? parts[2] : null,
      };
    } else {
      addressObj = { street: jsonRestaurant.address };
    }
  }

  // Parse hours from JSON format to array format
  const hoursArray: any[] = [];
  if (jsonRestaurant.hours && typeof jsonRestaurant.hours === "object") {
    const hoursObj = jsonRestaurant.hours as Record<string, string>;
    const dayMap: Array<[string, number]> = [
      ["monday", 1],
      ["tue", 2],
      ["tuesday", 2],
      ["wed", 3],
      ["wednesday", 3],
      ["thu", 4],
      ["thursday", 4],
      ["fri", 5],
      ["friday", 5],
      ["sat", 6],
      ["saturday", 6],
      ["sun", 0],
      ["sunday", 0],
    ];

    // Handle ranges like "mon_sat", "tue_sun", etc.
    for (const [key, value] of Object.entries(hoursObj)) {
      if (value === "Closed" || !value) continue;

      const rangeMatch = key.match(/^(\w+)_(\w+)$/);
      if (rangeMatch) {
        const [, startDay, endDay] = rangeMatch;
        const startDayNum = dayMap.find(([d]) => d === startDay.toLowerCase())?.[1];
        const endDayNum = dayMap.find(([d]) => d === endDay.toLowerCase())?.[1];
        if (startDayNum !== undefined && endDayNum !== undefined) {
          // Parse time range like "12:00 PM - 12:00 AM"
          const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
          if (timeMatch) {
            const [, h1, m1, p1, h2, m2, p2] = timeMatch;
            const open24h = convertTo24h(parseInt(h1), p1);
            const close24h = convertTo24h(parseInt(h2), p2);
            const openTime = `${String(open24h).padStart(2, "0")}:${m1}`;
            const closeTime = `${String(close24h).padStart(2, "0")}:${m2}`;

            // Add entries for each day in range
            const daysToAdd: number[] = [];
            
            // Handle wrapping around Sunday (0) to Saturday (6)
            if (startDayNum <= endDayNum) {
              // Normal range (e.g., Mon-Fri)
              for (let d = startDayNum; d <= endDayNum; d++) {
                daysToAdd.push(d);
              }
            } else {
              // Wrapping range (e.g., Sat-Sun)
              for (let d = startDayNum; d <= 6; d++) {
                daysToAdd.push(d);
              }
              for (let d = 0; d <= endDayNum; d++) {
                daysToAdd.push(d);
              }
            }
            
            daysToAdd.forEach((day) => {
              hoursArray.push({
                day_of_week: day,
                open_time: openTime,
                close_time: closeTime,
              });
            });
          }
        }
      } else {
        // Single day
        const dayNum = dayMap.find(([d]) => d === key.toLowerCase())?.[1];
        if (dayNum !== undefined && value !== "Closed") {
          const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
          if (timeMatch) {
            const [, h1, m1, p1, h2, m2, p2] = timeMatch;
            const open24h = convertTo24h(parseInt(h1), p1);
            const close24h = convertTo24h(parseInt(h2), p2);
            const openTime = `${String(open24h).padStart(2, "0")}:${m1}`;
            const closeTime = `${String(close24h).padStart(2, "0")}:${m2}`;
            hoursArray.push({
              day_of_week: dayNum,
              open_time: openTime,
              close_time: closeTime,
            });
          }
        }
      }
    }
  }

  // Extract Instagram handle from social object
  let instagramHandle: string | null = null;
  if (jsonRestaurant.social?.instagram) {
    const insta = jsonRestaurant.social.instagram;
    instagramHandle = insta.startsWith("@") ? insta.slice(1) : insta;
  }

  return {
    id: jsonRestaurant.id,
    name: jsonRestaurant.name,
    slug: jsonRestaurant.id, // Use id as slug
    cuisine_types: [jsonRestaurant.cuisine],
    price_range: priceRangeMap[jsonRestaurant.price_range] || 2,
    description: jsonRestaurant.about || null,
    our_story: jsonRestaurant.our_story || null,
    cultural_roots: jsonRestaurant.cultural_roots || null,
    special_features: null,
    menu: jsonRestaurant.menu_highlights ? { highlights: jsonRestaurant.menu_highlights } : null,
    address: addressObj,
    phone: jsonRestaurant.phone || null,
    website: jsonRestaurant.website && jsonRestaurant.website !== "N/A" ? jsonRestaurant.website : null,
    instagram_handle: instagramHandle,
    facebook_url: jsonRestaurant.social?.facebook || null,
    images: jsonRestaurant.images || [],
    hours: hoursArray.length > 0 ? hoursArray : jsonRestaurant.hours || null,
    avg_rating: jsonRestaurant.rating || null,
    review_count: 0,
    vibe_tags: jsonRestaurant.vibe_tags || null,
    region: jsonRestaurant.region || null, // Include region field for color mapping
    secondary_location: jsonRestaurant.secondary_location || null,
    neighborhood: jsonRestaurant.neighborhood || null,
    vibe: jsonRestaurant.vibe || null,
    specialty: jsonRestaurant.specialty || (jsonRestaurant.menu_highlights && jsonRestaurant.menu_highlights.length > 0 ? jsonRestaurant.menu_highlights[0] : null),
  };
}

function convertTo24h(hour: number, period: string): number {
  if (period === "AM") {
    return hour === 12 ? 0 : hour;
  } else {
    return hour === 12 ? 12 : hour + 12;
  }
}
