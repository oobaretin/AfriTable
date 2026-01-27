"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "JAMAICAN", "ETHIOPIAN", "GHANAIAN"];

export function HeroSearch() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [city, setCity] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

  // The original text-rotation logic
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % CUISINES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

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

    // Build search params with city
    const params = new URLSearchParams();
    params.set("city", city.trim());

    // Navigate to search results
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center bg-brand-dark overflow-hidden">
      {/* 1. The Original Background Vibes */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/kente-cloth.png')]"
          style={{
            backgroundSize: "300px 300px",
            backgroundRepeat: "repeat",
          }}
        ></div>
      </div>

      {/* 2. The Animated Text Engine */}
      <div className="relative z-10 text-center mb-16 px-6">
        <p className="text-brand-bronze font-black uppercase tracking-[0.4em] text-xs mb-4 animate-pulse">
          Experience the finest
        </p>
        
        <h1 className="text-6xl md:text-[120px] font-black text-white leading-none tracking-tighter">
          <span className="block">ULTIMATE</span>
          <span 
            className="block text-brand-ochre transition-all duration-700 ease-in-out"
            key={index}
          >
            {CUISINES[index]}
          </span>
          <span className="block">DINING</span>
        </h1>
      </div>

      {/* 3. The "Find Table" Dock - Minimalist Edition */}
      <div className="relative z-20 w-full max-w-3xl px-6">
        <div className="bg-white rounded-full p-2 shadow-2xl flex items-center group transition-all hover:ring-4 hover:ring-brand-ochre/20">
          <div className="flex-1 flex items-center px-6 gap-3">
            <span className="text-xl" role="img" aria-label="Location">
              📍
            </span>
            <input
              type="text"
              placeholder="Find a table in your city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full py-4 bg-transparent outline-none font-bold text-brand-dark placeholder:text-slate-300 text-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-brand-dark text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs transition-all hover:bg-brand-forest disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Find Table"}
          </button>
        </div>

        {/* Floating Tags for the names you loved */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 opacity-40">
          {CUISINES.map((c, i) => (
            <span
              key={i}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                index === i ? "text-brand-ochre opacity-100 scale-110" : "text-white"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Sankofa Seal */}
      <div className="absolute bottom-10 left-10 opacity-20">
        <Image
          src="/logo.png"
          alt="Sankofa"
          width={48}
          height={48}
          className="h-12 brightness-0 invert"
          priority
        />
      </div>
    </section>
  );
}
