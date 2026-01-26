#!/usr/bin/env node

const csvData = `ChòpnBlọk,507 Westheimer Rd,Houston,TX,77006,+1 832-962-4500,https://chopnblok.co/,https://www.instagram.com/chopnblọk/,https://www.facebook.com/chopnblok/,11:00-21:00 (daily),Modern West African restaurant celebrating diaspora flavors in Montrose with bowls, suya, and cocktails.,4.6
Amala Joint,6271 Highway 6 S,Houston,TX,77083,+1 281-721-2982,N/A,N/A,N/A,10:00-22:00 (M-Th/Su);10:00-19:00 (Fri),African restaurant with a range of traditional dishes.,4.5
Bantu House,22224 Northwest Fwy,Ste B,Cypress,TX,77429,+1 713-360-8333,http://bantuhouse.com,https://www.instagram.com/bantuhouse/?,https://www.facebook.com/bantuhouse/,12:00-22:00 (Tue-Sat),Celebrates diverse African culinary heritage with regional dishes and cultural vibe.,4.7
Kofoshi,3706 S Gessner Rd,Houston,TX,77063,+1 346-252-2336,N/A,N/A,N/A,12:00-20:00 (Sun);11:00-21:00 (Mon-Fri);12:00-21:00 (Sat),West African restaurant known for flavorful cuisine.,4.6
Lucy Ethiopian Restaurant & Lounge,6800 Southwest Fwy,Houston,TX,77074,+1 713-334-0000,http://www.lucyhouston.com,https://www.instagram.com/lucyhouston/? ,https://www.facebook.com/LucyEthiopianRestaurant/,11:00-23:00 (Tue-Sun),Ethiopian restaurant and lounge with traditional dishes like injera and stews.,4.3
Sarabell Calabar Restaurant & Buffet,9801 Bissonnet St Ste C,Houston,TX,77036,+1 713-814-5253,https://sarabellcalabarrestaurant.com,https://www.instagram.com/sarabellcalabar/,https://www.facebook.com/sarabellcalabar/,08:00-21:00 (daily),Buffet-style Nigerian cuisine with traditional favorites.,4.7
Marie African Flavors,12600 Bissonnet St Ste A7,Houston,TX,77099,+1 832-771-8778,N/A,https://www.instagram.com/marieafricanflavors/,https://www.facebook.com/MarieAfricanFlavors/,12:30-22:00 (M-Th);12:30-23:00 (F-Su),African restaurant featuring jollof rice, grilled fish, and more.,3.5
Delight's Ghanaian Cuisine,14524 Piping Rock Ln,Houston,TX,77077,+1 281-995-1958,https://order.spoton.com/so-delights-delight-kitchen-3629/houston-tx/6532c4ce2cb4e2003dd65e05,https://www.instagram.com/delight_foodtx/,https://www.facebook.com/DelightsGhanaianCuisine/,11:30-19:00 (Su);11:30-19:00 (M);11:30-21:00 (Tu-Sa),Ghanaian cuisine with favorites like jollof and suya.,4.8
Afro Caribbean Grill,1903 Blodgett St,Houston,TX,77004,+1 713-804-2764,https://afrocaribbeangrill.com/,https://www.instagram.com/afrocaribbeangrill/,https://www.facebook.com/AfroCaribbeanGrill/,Tue 4-10;Wed 4-10;Thu 12-10;Fri 4-12;Sat 12-12;Sun 12-10,West African and Caribbean fusion featuring suya, jerk, and more, with catering.,(rating not available)
Safari,10014 Bissonnet St,Houston,TX,77036,+1 713-541-4436,https://thesafarirestaurant.com/,https://www.instagram.com/thesafarirestaurantx/,https://www.facebook.com/TheSafariRestaurant/,11:00-02:00 (daily),Iconic Houston Nigerian restaurant known for soups, fufu, and West African classics.,4.1
Afrikiko Restaurant,9625 Bissonnet St,Houston,TX,77036,+1 713-773-1400,http://afrikikohouston.com,https://www.instagram.com/afrikiko/,https://www.facebook.com/afrikikohouston/,(varies),West African restaurant serving Ghanaian and Nigerian dishes.,4.0
Taste of Nigeria,5959 Richmond Ave Ste 160,Houston,TX,77057,+1 713-589-9055,https://tasteofnigeria.us,https://www.instagram.com/tasteofnigeriahouston/,https://www.facebook.com/TasteOfNigeriaHouston/,12:00-22:00 (M-Th);12:00-02:00 (F-Sa);12:00-21:00 (Su),Family-operated Nigerian cuisine with traditional flavors.,3.1
Aria Suya Kitchen,6357 Westheimer Rd,Houston,TX,77057,+1 832-831-4372,https://www.ariasuyakitchen.com,https://www.instagram.com/ariasuyakitchen/,https://www.facebook.com/ariasuyakitchen/,(varies),Nigerian suya and fusion menu in a trendy setting.,4.2
Fabaceae African Cuisine,10023 S Main St Bldg 7,Houston,TX,77025,+1 512-840-0855,http://www.fabaceaecuisine.com,https://www.instagram.com/fabaceaecuisine/,https://www.facebook.com/fabaceaecuisine/,11:00-21:00 (daily),Authentic Nigerian cuisine focused on classic dishes.,4.2
Suya Hut,11720 W Airport Blvd Ste 1600,Meadows Place,TX,77477,+1 281-265-1411,https://therealsuyahut.com/,https://www.instagram.com/therealsuyahut/,https://www.facebook.com/therealsuyahut/,11:00-21:00 (M-Sa);Closed Sun,Suya Hut specializes in Nigerian suya skewers, jollof rice and West African flavors.,(rating not available)`;

function parseHours(hoursStr) {
  if (!hoursStr || hoursStr === "(varies)" || hoursStr.trim() === "") {
    return {
      monday: { open: "", close: "", closed: true },
      tuesday: { open: "", close: "", closed: true },
      wednesday: { open: "", close: "", closed: true },
      thursday: { open: "", close: "", closed: true },
      friday: { open: "", close: "", closed: true },
      saturday: { open: "", close: "", closed: true },
      sunday: { open: "", close: "", closed: true },
    };
  }

  const hours = {
    monday: { open: "", close: "", closed: true },
    tuesday: { open: "", close: "", closed: true },
    wednesday: { open: "", close: "", closed: true },
    thursday: { open: "", close: "", closed: true },
    friday: { open: "", close: "", closed: true },
    saturday: { open: "", close: "", closed: true },
    sunday: { open: "", close: "", closed: true },
  };

  // Handle "daily" pattern
  const dailyMatch = hoursStr.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})\s*\(daily\)/i);
  if (dailyMatch) {
    const open = `${dailyMatch[1]}:${dailyMatch[2]}`;
    let closeHour = parseInt(dailyMatch[3]);
    const closeMin = dailyMatch[4];
    // Handle next-day close times (e.g., 02:00 means 2 AM next day = 26:00)
    if (closeHour < 8) closeHour += 24;
    const close = `${String(closeHour).padStart(2, "0")}:${closeMin}`;
    for (const day of Object.keys(hours)) {
      hours[day] = { open, close, closed: false };
    }
    return hours;
  }

  // Handle "11:00-02:00 (daily)" - next day close
  const nextDayMatch = hoursStr.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})\s*\(daily\)/i);
  if (nextDayMatch) {
    const open = `${nextDayMatch[1]}:${nextDayMatch[2]}`;
    const close = `${nextDayMatch[3]}:${nextDayMatch[4]}`;
    for (const day of Object.keys(hours)) {
      hours[day] = { open: `${open}:00`, close: `${close}:00`, closed: false };
    }
    return hours;
  }

  // Handle day-specific patterns like "Tue 4-10;Wed 4-10"
  const dayPatterns = {
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
    sun: "sunday",
  };

  const parts = hoursStr.split(";");
  for (const part of parts) {
    const dayMatch = part.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})-(\d{1,2})/i);
    if (dayMatch) {
      const dayKey = dayPatterns[dayMatch[1].toLowerCase().slice(0, 3)];
      if (dayKey) {
        const openHour = dayMatch[2].padStart(2, "0");
        const closeHour = dayMatch[3].padStart(2, "0");
        hours[dayKey] = {
          open: `${openHour}:00`,
          close: `${closeHour}:00`,
          closed: false,
        };
      }
    }

    // Handle "12:00-22:00 (M-Th/Su)" pattern
    const rangeMatch = part.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})\s*\(([^)]+)\)/);
    if (rangeMatch) {
      const open = `${rangeMatch[1]}:${rangeMatch[2]}`;
      const close = `${rangeMatch[3]}:${rangeMatch[4]}`;
      const days = rangeMatch[5];

      // Parse day ranges
      if (days.includes("M-Th")) {
        hours.monday = { open: `${open}:00`, close: `${close}:00`, closed: false };
        hours.tuesday = { open: `${open}:00`, close: `${close}:00`, closed: false };
        hours.wednesday = { open: `${open}:00`, close: `${close}:00`, closed: false };
        hours.thursday = { open: `${open}:00`, close: `${close}:00`, closed: false };
      }
      if (days.includes("Su")) {
        hours.sunday = { open: `${open}:00`, close: `${close}:00`, closed: false };
      }
      if (days.includes("F-Sa")) {
        hours.friday = { open: `${open}:00`, close: `${close}:00`, closed: false };
        hours.saturday = { open: `${open}:00`, close: `${close}:00`, closed: false };
      }
    }

    // Handle "12:00-22:00 (M-Th);12:00-02:00 (F-Sa)" pattern
    const multiRangeMatch = hoursStr.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})\s*\(([^)]+)\)/g);
    if (multiRangeMatch) {
      for (const match of multiRangeMatch) {
        const m = match.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})\s*\(([^)]+)\)/);
        if (m) {
          const open = `${m[1]}:${m[2]}`;
          const close = `${m[3]}:${m[4]}`;
          const days = m[5];

          if (days.includes("M-Th")) {
            hours.monday = { open: `${open}:00`, close: `${close}:00`, closed: false };
            hours.tuesday = { open: `${open}:00`, close: `${close}:00`, closed: false };
            hours.wednesday = { open: `${open}:00`, close: `${close}:00`, closed: false };
            hours.thursday = { open: `${open}:00`, close: `${close}:00`, closed: false };
          }
          if (days.includes("F-Sa")) {
            hours.friday = { open: `${open}:00`, close: `${close}:00`, closed: false };
            hours.saturday = { open: `${open}:00`, close: `${close}:00`, closed: false };
          }
          if (days.includes("Su")) {
            hours.sunday = { open: `${open}:00`, close: `${close}:00`, closed: false };
          }
        }
      }
    }
  }

  // Handle "11:00-21:00 (M-Sa);Closed Sun"
  if (hoursStr.includes("Closed Sun")) {
    hours.sunday = { open: "", close: "", closed: true };
  }

  return hours;
}

function normalizeValue(value) {
  if (!value || value === "N/A" || value.trim() === "") return null;
  return value.trim();
}

function parseRating(ratingStr) {
  if (!ratingStr || ratingStr === "(rating not available)" || ratingStr.trim() === "") return null;
  const num = parseFloat(ratingStr);
  return isNaN(num) ? null : num;
}

const lines = csvData.split("\n");
const restaurants = [];

for (const line of lines) {
  if (!line.trim()) continue;

  // Simple CSV parsing (handles commas in quoted fields)
  const parts = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);

  if (parts.length < 12) continue;

  const name = parts[0].trim();
  const street = parts[1].trim();
  const city = parts[2].trim();
  const state = parts[3].trim();
  const zip = parts[4].trim();
  const phone = normalizeValue(parts[5]);
  const website = normalizeValue(parts[6]);
  const instagram = normalizeValue(parts[7]);
  const facebook = normalizeValue(parts[8]);
  const hoursStr = parts[9].trim();
  const description = parts[10].trim();
  const rating = parseRating(parts[11]);

  // Determine cuisine type from name/description
  let cuisineTypes = ["African"];
  if (name.toLowerCase().includes("ethiopian") || description.toLowerCase().includes("ethiopian")) {
    cuisineTypes = ["Ethiopian"];
  } else if (name.toLowerCase().includes("ghanaian") || description.toLowerCase().includes("ghanaian")) {
    cuisineTypes = ["Ghanaian", "West African"];
  } else if (name.toLowerCase().includes("nigerian") || description.toLowerCase().includes("nigerian")) {
    cuisineTypes = ["Nigerian", "West African"];
  } else if (name.toLowerCase().includes("senegalese") || description.toLowerCase().includes("senegalese")) {
    cuisineTypes = ["Senegalese", "West African"];
  } else if (name.toLowerCase().includes("caribbean") || description.toLowerCase().includes("caribbean")) {
    cuisineTypes = ["African", "Caribbean"];
  } else if (description.toLowerCase().includes("west african")) {
    cuisineTypes = ["West African"];
  }

  const restaurant = {
    name,
    cuisine_types: cuisineTypes,
    address: {
      street: street,
      city: city,
      state: state,
      zip: zip,
    },
    phone: phone,
    website: website,
    instagram: instagram,
    facebook: facebook,
    description: description,
    price_range: 2, // Default, can be adjusted
    google_rating: rating,
    hours: parseHours(hoursStr),
  };

  restaurants.push(restaurant);
}

console.log(JSON.stringify(restaurants, null, 2));
