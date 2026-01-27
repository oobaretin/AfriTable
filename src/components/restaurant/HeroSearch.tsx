"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const CUISINES = [
  "All Cuisines",
  "Nigerian",
  "Jamaican",
  "Ethiopian",
  "Senegalese",
  "Ghanaian",
  "Somali",
  "Eritrean",
  "Trinidadian",
  "Haitian",
  "South African",
  "Kenyan",
  "Other African",
  "Other Caribbean",
];

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = React.useState("");
  const [cuisine, setCuisine] = React.useState("All Cuisines");
  const [isSearching, setIsSearching] = React.useState(false);

  function handleSearch() {
    if (!city.trim()) {
      // If no city, just scroll to restaurants section
      const restaurantsSection = document.getElementById("restaurants-section");
      if (restaurantsSection) {
        restaurantsSection.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setIsSearching(true);

    // Build search params
    const params = new URLSearchParams();
    params.set("city", city.trim());
    if (cuisine && cuisine !== "All Cuisines") {
      params.set("cuisine", cuisine);
    }

    // Navigate to search results
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-brand-dark">
      {/* 1. ANIMATED BACKGROUND SHAPES (z-0) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Floating gradient blurs - animated */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-forest/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-mutedRed/10 blur-[120px] animate-pulse" style={{ animationDelay: "700ms" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-brand-ochre/5 blur-[150px] animate-pulse" style={{ animationDelay: "1400ms" }}></div>
        
        {/* Optional: Background image overlay (subtle) */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-160432870172bb-388279930f9a?auto=format&fit=crop&q=80&w=2000"
            alt="African Fine Dining"
            fill
            className="object-cover grayscale-[30%]"
            priority
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/80 via-brand-dark/60 to-brand-dark"></div>
      </div>

      {/* 2. BRAND STORY - CENTERED (z-10) */}
      <div className="relative z-10 text-center px-6 mb-12">
        <Image
          src="/logo.png"
          alt="AfriTable Logo"
          width={64}
          height={64}
          className="h-16 mx-auto mb-8 brightness-0 invert animate-fade-in"
          priority
        />
        <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-4">
          Taste the <br /> <span className="text-brand-ochre">Heritage</span>
        </h1>
        <p className="text-slate-300 text-lg md:text-xl font-medium italic opacity-80">
          Connecting the Diaspora, one table at a time.
        </p>
      </div>

      {/* 3. FLOATING SEARCH DOCK - BOTTOM (z-20) */}
      <div className="relative z-20 w-full max-w-5xl px-6">
        <div className="bg-white/95 backdrop-blur-xl p-3 md:p-4 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row gap-3 items-center border border-white/20">
          {/* City Input */}
          <div className="flex-1 w-full flex items-center px-5 gap-3 border-r-0 md:border-r border-slate-100">
            <span className="text-xl" role="img" aria-label="Location">
              📍
            </span>
            <input
              type="text"
              placeholder="Select City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full py-3 bg-transparent outline-none font-bold text-brand-dark placeholder:text-slate-400"
            />
          </div>

          {/* Cuisine Dropdown */}
          <div className="flex-1 w-full flex items-center px-5 gap-3">
            <span className="text-xl" role="img" aria-label="Cuisine">
              🥘
            </span>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full py-3 bg-transparent outline-none font-bold text-brand-dark appearance-none cursor-pointer"
            >
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Find Table Button */}
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full md:w-auto bg-brand-dark hover:bg-brand-forest text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Find Table"}
          </Button>
        </div>

        {/* Subtle Scroll Indicator */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-30 animate-bounce">
          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Explore</span>
          <div className="w-[1px] h-8 bg-white"></div>
        </div>
      </div>
    </section>
  );
}
