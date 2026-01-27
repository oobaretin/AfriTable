/**
 * Helper functions to generate default restaurant content based on cuisine types
 */

export interface RestaurantContent {
  about: string;
  our_story: string;
  cultural_roots: string;
  special_features: string;
}

const cuisineContentMap: Record<string, Partial<RestaurantContent>> = {
  Nigerian: {
    about:
      "Authentic Nigerian restaurant serving traditional West African cuisine. Experience the bold flavors of jollof rice, hearty stews, and grilled specialties in a warm, welcoming atmosphere that celebrates Nigerian culture and hospitality.",
    our_story:
      "We bring the authentic flavors of Nigeria to your table, serving traditional dishes passed down through generations. Our commitment is to share the rich culinary heritage of West Africa with every plate.",
    cultural_roots:
      "Nigerian cuisine is a celebration of bold spices, hearty stews, and communal dining. Our dishes reflect the diverse regions of Nigeria, from the spicy jollof rice of the south to the savory suya of the north. Each recipe tells a story of family, tradition, and the vibrant culture that makes Nigerian food beloved worldwide.",
    special_features:
      "Experience authentic Nigerian hospitality with our signature dishes including jollof rice, egusi soup, pepper soup, and suya. We offer traditional dining experiences, catering services, and special events celebrating Nigerian culture.",
  },
  Ethiopian: {
    about:
      "Traditional Ethiopian restaurant featuring authentic East African cuisine. Enjoy communal dining with injera bread, flavorful stews, and traditional coffee ceremonies in an atmosphere that honors Ethiopia's rich culinary heritage.",
    our_story:
      "We honor the ancient traditions of Ethiopian cuisine, bringing the communal spirit of injera and wat to our community. Our restaurant is a place where food brings people together, just as it has for centuries in the highlands of Ethiopia.",
    cultural_roots:
      "Ethiopian cuisine is one of the oldest in the world, with a history spanning over 3,000 years. Our dishes feature the unique flavors of berbere spice, fermented injera bread, and slow-cooked stews. The tradition of sharing food from a common platter (mesob) reflects the Ethiopian values of community and togetherness.",
    special_features:
      "Enjoy traditional Ethiopian dining with our authentic injera, doro wat, kitfo, and vegetarian platters. We offer coffee ceremonies, cultural events, and private dining experiences that showcase the depth of Ethiopian culinary traditions.",
  },
  Ghanaian: {
    about:
      "Authentic Ghanaian restaurant bringing the vibrant flavors of West Africa to your table. Savor traditional dishes like jollof rice, fufu, and groundnut stew in a setting that celebrates Ghanaian culture and warm hospitality.",
    our_story:
      "From the bustling markets of Accra to your table, we serve authentic Ghanaian cuisine that honors our heritage. Our recipes come from family kitchens and local traditions, bringing the warmth of Ghanaian hospitality to every meal.",
    cultural_roots:
      "Ghanaian cuisine reflects the country's rich history and diverse regions. Our dishes feature the bold flavors of palm nut soup, groundnut stew, and jollof rice. Food in Ghana is more than sustenance—it's a way of bringing families and communities together, celebrating life's moments with shared meals and laughter.",
    special_features:
      "Discover authentic Ghanaian flavors with our fufu, banku, kelewele, and red red. We offer traditional preparation methods, cultural dining experiences, and special events that celebrate Ghanaian festivals and traditions.",
  },
  Senegalese: {
    about:
      "Authentic Senegalese restaurant showcasing the sophisticated flavors of West Africa. Experience the national dish thieboudienne, along with yassa and mafé, in an atmosphere that embodies teranga—the Senegalese spirit of hospitality.",
    our_story:
      "We celebrate the culinary artistry of Senegal, known as the gateway to West Africa. Our restaurant brings the sophisticated flavors of Senegalese cuisine, where French and West African influences create something truly special.",
    cultural_roots:
      "Senegalese cuisine is renowned for its complex flavors and presentation. Dishes like thieboudienne (the national dish), yassa, and mafé showcase the country's culinary sophistication. Food in Senegal is an expression of teranga—the Wolof concept of hospitality that welcomes all with open arms and generous portions.",
    special_features:
      "Experience the elegance of Senegalese dining with our thieboudienne, yassa, mafé, and pastels. We offer traditional cooking demonstrations, cultural events, and authentic Senegalese hospitality that makes every guest feel like family.",
  },
  Jamaican: {
    about:
      "Authentic Jamaican restaurant serving vibrant Caribbean cuisine. Enjoy jerk chicken, curry goat, ackee and saltfish, and other island favorites in a warm atmosphere that captures the spirit of Jamaica.",
    our_story:
      "We bring the vibrant flavors of Jamaica to your neighborhood, serving authentic Caribbean cuisine that captures the island's spirit. From jerk seasoning to curry goat, our dishes tell the story of Jamaica's rich cultural heritage.",
    cultural_roots:
      "Jamaican cuisine is a fusion of African, Indian, Chinese, and European influences, creating a unique culinary identity. Our dishes celebrate the island's history, from the Maroon communities to the diverse immigrant populations. Food in Jamaica is about celebration, community, and the bold flavors that make the island's cuisine world-famous.",
    special_features:
      "Enjoy authentic Jamaican flavors with our jerk chicken, curry goat, ackee and saltfish, and patties. We offer traditional preparation methods, live music events, and a warm atmosphere that brings the spirit of Jamaica to every visit.",
  },
  Caribbean: {
    about:
      "Authentic Caribbean restaurant celebrating the diverse flavors of the islands. From roti to callaloo, experience the bold spices and tropical ingredients that define Caribbean cuisine in a festive, welcoming atmosphere.",
    our_story:
      "We celebrate the diverse flavors of the Caribbean, bringing together the best of island cuisine from across the region. Our restaurant is a journey through the Caribbean, one delicious dish at a time.",
    cultural_roots:
      "Caribbean cuisine reflects the region's complex history of indigenous peoples, African heritage, European colonization, and Asian influences. Our dishes showcase the bold spices, tropical ingredients, and slow-cooking techniques that define Caribbean food. Each island has its own traditions, but all share a love of flavor, community, and celebration.",
    special_features:
      "Explore Caribbean flavors with our roti, callaloo, conch fritters, and rum-infused desserts. We offer island-inspired cocktails, cultural events, and a festive atmosphere that captures the warmth and vibrancy of Caribbean culture.",
  },
  "West African": {
    about:
      "Authentic West African restaurant serving traditional dishes from across the region. Experience the bold spices, hearty stews, and communal dining traditions that make West African cuisine a celebration of flavor and community.",
    our_story:
      "We honor the rich culinary traditions of West Africa, serving authentic dishes that showcase the region's diverse flavors and cooking techniques. Our restaurant is a celebration of West African hospitality and the vibrant food culture that spans from Senegal to Nigeria.",
    cultural_roots:
      "West African cuisine is characterized by bold spices, hearty stews, and the use of ingredients like palm oil, groundnuts, and cassava. Our dishes reflect the region's history of trade, migration, and cultural exchange. Food in West Africa is central to social life, bringing families and communities together for shared meals and celebrations.",
    special_features:
      "Experience West African cuisine with our jollof rice, groundnut stew, fufu, and suya. We offer traditional preparation methods, cultural dining experiences, and special events that celebrate the diversity and richness of West African food traditions.",
  },
  "East African": {
    about:
      "Authentic East African restaurant featuring traditional dishes from Ethiopia, Eritrea, Kenya, and Tanzania. Enjoy distinctive spice blends, injera, and other regional specialties in an atmosphere that honors East African culinary traditions.",
    our_story:
      "We bring the distinctive flavors of East Africa to your table, serving dishes that reflect the region's unique spice blends and cooking traditions. Our restaurant celebrates the culinary heritage of countries like Ethiopia, Eritrea, Kenya, and Tanzania.",
    cultural_roots:
      "East African cuisine is known for its use of spices like cardamom, cumin, and turmeric, as well as staple foods like injera, ugali, and chapati. Our dishes reflect the region's history of trade along the Swahili coast and the influence of Arab, Indian, and European cuisines. Food in East Africa is about sharing, community, and the rich flavors that define the region.",
    special_features:
      "Discover East African flavors with our injera, samosas, pilau, and nyama choma. We offer traditional coffee ceremonies, cultural events, and authentic dining experiences that showcase the depth and diversity of East African cuisine.",
  },
};

/**
 * Generate default content for a restaurant based on its cuisine types
 */
export function generateDefaultContent(
  restaurantName: string,
  cuisineTypes: string[],
): RestaurantContent {
  // Find the best matching cuisine content
  let matchedContent: Partial<RestaurantContent> = {};

  for (const cuisine of cuisineTypes) {
    const normalized = cuisine.trim();
    if (cuisineContentMap[normalized]) {
      matchedContent = { ...matchedContent, ...cuisineContentMap[normalized] };
      break; // Use the first match
    }
  }

  // If no specific match, try broader categories
  if (!matchedContent.our_story) {
    if (cuisineTypes.some((c) => c.toLowerCase().includes("west african"))) {
      matchedContent = cuisineContentMap["West African"];
    } else if (cuisineTypes.some((c) => c.toLowerCase().includes("east african"))) {
      matchedContent = cuisineContentMap["East African"];
    } else if (cuisineTypes.some((c) => c.toLowerCase().includes("caribbean"))) {
      matchedContent = cuisineContentMap["Caribbean"];
    }
  }

  // Generate defaults if still missing
  const primaryCuisine = cuisineTypes[0] || "African";

  return {
    about:
      matchedContent.about ||
      `${restaurantName} brings authentic ${primaryCuisine} cuisine to our community. Experience traditional flavors, warm hospitality, and dishes prepared with care using time-honored recipes and fresh ingredients.`,
    our_story:
      matchedContent.our_story ||
      `Welcome to ${restaurantName}. We are passionate about bringing authentic ${primaryCuisine} cuisine to our community. Our journey began with a simple mission: to share the rich flavors and warm hospitality that define ${primaryCuisine} dining. Every dish we serve is prepared with care, using traditional recipes and fresh ingredients that honor our culinary heritage.`,
    cultural_roots:
      matchedContent.cultural_roots ||
      `${primaryCuisine} cuisine is a celebration of bold flavors, aromatic spices, and time-honored cooking techniques. Our dishes reflect the rich cultural heritage of ${primaryCuisine} food traditions, where every meal is an opportunity to bring people together. Food in ${primaryCuisine} culture is more than sustenance—it's a way of expressing love, celebrating community, and preserving traditions that have been passed down through generations.`,
    special_features:
      matchedContent.special_features ||
      `Experience authentic ${primaryCuisine} hospitality with our signature dishes, traditional preparation methods, and warm, welcoming atmosphere. We offer catering services, special events, and private dining experiences. Our commitment is to provide an authentic taste of ${primaryCuisine} culture in every bite.`,
  };
}
