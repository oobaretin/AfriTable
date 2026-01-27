"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "JAMAICAN", "ETHIOPIAN", "GHANAIAN", "HAITIAN", "NIGERIAN"];

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

  function handleSearch() {
    if (!city.trim()) {
      // If no city, just scroll to restaurants section
      const restaurantsSection = document.getElementById("restaurants-section");
      if (restaurantsSection) {
        restaurantsSection.scrollIntoView({ behavior: "smooth" });
        return;
      }
      return;
    }

    setIsSearching(true);

    // Build search params with city
    const params = new URLSearchParams();
    params.set("city", city.trim());

    // Navigate to search results
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center bg-brand-dark overflow-hidden">
      {/* 1. The Background Branding */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/kente-cloth.png')]"></div>
      </div>

      {/* 2. The Animated Identity Engine */}
      <div className="relative z-10 flex flex-col items-center select-none">
        <h2 className="text-brand-bronze font-black uppercase tracking-[0.6em] text-[10px] md:text-xs mb-8 animate-pulse">
          The Soul of the Diaspora
        </h2>

        <div className="flex flex-col items-center">
          <span className="text-[12vw] font-black text-white leading-[0.7] tracking-tighter italic">ULTIMATE</span>
          
          {/* THE SPECIFIC ANIMATION: Vertical Scrolling Names */}
          <div className="h-[14vw] overflow-hidden my-2">
            <div className="animate-vertical-roll"> 
              {CUISINES.map((name, i) => (
                <span key={i} className="block text-[14vw] font-black text-brand-ochre leading-none tracking-tighter text-center">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <span className="text-[12vw] font-black text-white leading-[0.7] tracking-tighter italic">DINING</span>
        </div>
      </div>

      {/* 3. THE ADDITION: Minimalist Find Table Button */}
      <div className="relative z-30 mt-20 w-full max-w-lg px-6">
        <div className="flex bg-white rounded-full p-1.5 shadow-2xl items-center border border-white/20 group hover:ring-4 hover:ring-brand-ochre/20 transition-all">
          <input
            type="text"
            placeholder="Enter your city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="flex-1 bg-transparent px-6 py-3 outline-none font-bold text-brand-dark placeholder:text-slate-300"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-brand-dark text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-brand-forest transition-colors disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Find Table"}
          </button>
        </div>
      </div>

      {/* Footer Logo */}
      <div className="absolute bottom-12 opacity-30">
        <Image
          src="/logo.png"
          alt="Sankofa"
          width={32}
          height={32}
          className="h-8 brightness-0 invert"
          priority
        />
      </div>
    </section>
  );
}
