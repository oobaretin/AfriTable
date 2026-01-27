"use client";

import * as React from "react";
import Image from "next/image";

type ChefsRecommendationProps = {
  dishName?: string;
  dishImage?: string;
  quote?: string;
  cuisine: string;
  restaurantName: string;
};

// Generate cuisine-based chef quotes if not provided
function getCuisineBasedQuote(cuisine: string, restaurantName: string): { dishName: string; quote: string } {
  const cuisineLower = cuisine.toLowerCase();
  
  const quotes: Record<string, { dishName: string; quote: string }> = {
    nigerian: {
      dishName: "Signature Jollof Rice",
      quote: `Our jollof is slow-cooked with tomatoes, peppers, and a secret blend of spices that have been passed down through generations. It's the dish that brings our community together—each grain tells a story of home.`,
    },
    ethiopian: {
      dishName: "Traditional Doro Wat",
      quote: `This is our heart dish. The chicken is marinated for hours in our house-made berbere spice blend, then slow-simmered until it falls off the bone. Served with fresh injera, it's a taste of Addis Ababa right here.`,
    },
    jamaican: {
      dishName: "Jerk Chicken",
      quote: `Our jerk chicken is marinated for 24 hours in a blend of scotch bonnet peppers, allspice, and thyme—then slow-smoked over pimento wood. It's the authentic flavor of Kingston's street food scene, elevated.`,
    },
    ghanaian: {
      dishName: "Banku & Tilapia",
      quote: `This is comfort food at its finest. Our banku is fermented fresh daily, and the tilapia is grilled to perfection with our signature pepper sauce. It's the dish that reminds us of home.`,
    },
    senegalese: {
      dishName: "Thieboudienne",
      quote: `Our national dish, prepared with the utmost care. The fish is perfectly seasoned and served over broken rice with vegetables. It's a celebration of Senegalese culinary heritage in every bite.`,
    },
    somali: {
      dishName: "Bariis & Hilib",
      quote: `Our basmati rice is infused with aromatic spices and served with tender, slow-cooked goat meat. It's a traditional dish that represents the warmth and hospitality of Somali culture.`,
    },
    eritrean: {
      dishName: "Zigni",
      quote: `Slow-cooked beef in a rich, spicy berbere sauce served with fresh injera. This is the dish that defines our kitchen—bold flavors that honor our Eritrean roots.`,
    },
    haitian: {
      dishName: "Griot",
      quote: `Our griot is marinated overnight in sour orange and spices, then fried until crispy on the outside and tender inside. It's the authentic taste of Port-au-Prince, served with pikliz and rice.`,
    },
    trinidadian: {
      dishName: "Doubles",
      quote: `Fresh bara bread, curried channa, and our house-made pepper sauce—this is street food elevated. Each bite brings the vibrant energy of Port of Spain to your table.`,
    },
    "south african": {
      dishName: "Bobotie",
      quote: `Our bobotie is a fusion of sweet and savory, with spiced minced meat topped with an egg custard. It's a taste of Cape Town's diverse culinary heritage, served with yellow rice and chutney.`,
    },
    kenyan: {
      dishName: "Nyama Choma",
      quote: `Grilled goat meat, marinated in our secret spice blend and slow-cooked over an open flame. Served with ugali and sukuma wiki, it's the authentic taste of Nairobi's best street food.`,
    },
    cameroonian: {
      dishName: "Ndole Soup",
      quote: `Our ndole is made with bitterleaf, groundnuts, and tender meat—slow-simmered to perfection. It's a dish that represents the heart of Cameroonian cuisine, rich in flavor and tradition.`,
    },
  };

  // Try to find exact match
  for (const [key, value] of Object.entries(quotes)) {
    if (cuisineLower.includes(key)) {
      return value;
    }
  }

  // Fallback for any African cuisine
  if (cuisineLower.includes("african") || cuisineLower.includes("west african") || cuisineLower.includes("east african")) {
    return {
      dishName: "Chef's Signature Dish",
      quote: `This dish represents the heart of ${restaurantName}. Prepared with traditional techniques and the finest ingredients, it's a celebration of African culinary heritage that we're proud to share with you.`,
    };
  }

  // Fallback for Caribbean cuisine
  if (cuisineLower.includes("caribbean")) {
    return {
      dishName: "Chef's Signature Dish",
      quote: `This dish captures the vibrant spirit of Caribbean cuisine. Made with fresh ingredients and traditional spices, it's a taste of the islands that brings warmth and flavor to every bite.`,
    };
  }

  // Generic fallback
  return {
    dishName: "Chef's Signature Dish",
    quote: `This is the dish that defines our kitchen. Prepared with passion and the finest ingredients, it represents everything we stand for—authenticity, tradition, and culinary excellence.`,
  };
}

export function ChefsRecommendation({
  dishName,
  dishImage,
  quote,
  cuisine,
  restaurantName,
}: ChefsRecommendationProps) {
  const fallback = getCuisineBasedQuote(cuisine, restaurantName);
  const finalDishName = dishName || fallback.dishName;
  const finalQuote = quote || fallback.quote;
  const finalImage = dishImage || "/api/placeholder/200/200";

  return (
    <div className="bg-brand-paper rounded-[2rem] p-8 border border-brand-bronze/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 text-8xl">👩🏾‍🍳</div>
      <h3 className="text-xs font-black text-brand-bronze uppercase tracking-[0.2em] mb-6">The Chef&apos;s Choice</h3>
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="w-32 h-32 rounded-2xl overflow-hidden rotate-3 shadow-lg flex-shrink-0">
          <Image
            src={finalImage}
            alt={finalDishName}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="text-2xl font-black text-brand-dark mb-2">{finalDishName}</h4>
          <p className="text-slate-600 italic leading-relaxed">&quot;{finalQuote}&quot;</p>
        </div>
      </div>
    </div>
  );
}
