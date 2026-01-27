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

const TRENDING_CITIES = ["Houston", "New York", "Atlanta", "Washington DC", "Miami"];

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

  function handleCityClick(cityName: string) {
    setCity(cityName);
    // Auto-trigger search after a brief delay
    setTimeout(() => {
      const params = new URLSearchParams();
      params.set("city", cityName);
      router.push(`/restaurants?${params.toString()}`);
    }, 300);
  }

  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-brand-dark">
      {/* Background: High-end, dark, moody food photography with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-160432870172bb-388279930f9a?auto=format&fit=crop&q=80&w=2000"
          alt="African Fine Dining"
          fill
          className="object-cover opacity-40 grayscale-[20%]"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/60 via-brand-dark/40 to-brand-dark"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 text-center">
        <Image
          src="/logo.png"
          alt="Sankofa Logo"
          width={64}
          height={64}
          className="h-16 mx-auto mb-8 brightness-0 invert"
          priority
        />

        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]">
          The Soul of <br />
          <span className="text-brand-ochre">The Diaspora</span>
        </h1>

        <p className="text-slate-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium italic">
          Discover and book the finest African &amp; Caribbean dining experiences.
        </p>

        {/* THE CORE ENGINE: The Search Bar */}
        <div className="bg-white p-2 md:p-4 rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-2 items-center">
          <div className="flex-1 w-full flex items-center px-4 gap-3 border-r-0 md:border-r border-slate-100">
            <span className="text-xl" role="img" aria-label="Location">
              📍
            </span>
            <input
              type="text"
              placeholder="Which city?"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full py-3 bg-transparent outline-none font-bold text-brand-dark placeholder:text-slate-300"
            />
          </div>
          <div className="flex-1 w-full flex items-center px-4 gap-3">
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
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full md:w-auto bg-brand-bronze hover:bg-brand-dark text-white px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Find Table"}
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
          <span className="text-white/30">Trending:</span>
          {TRENDING_CITIES.map((cityName, i) => (
            <React.Fragment key={cityName}>
              <button
                onClick={() => handleCityClick(cityName)}
                className="hover:text-brand-ochre transition-colors cursor-pointer"
              >
                {cityName}
              </button>
              {i < TRENDING_CITIES.length - 1 && <span>•</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
