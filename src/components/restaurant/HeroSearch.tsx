"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "HAITIAN", "ETHIOPIAN", "JAMAICAN"];
const CATCHPHRASES = ["CURATED", "AUTHENTIC", "UNFILTERED", "PREMIUM"];

export function HeroSearch() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [city, setCity] = React.useState("");

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % CUISINES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

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

    // Build search params with city
    const params = new URLSearchParams();
    params.set("city", city.trim());

    // Navigate to search results
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <section className="relative h-screen w-full bg-[#050A18] flex flex-col items-center justify-center overflow-hidden">
      {/* 1. 3D DEEP BLUE BACKGROUND STRUCTURES */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1000ms" }}></div>
      </div>

      {/* 2. CATCHY WORDS (The "Floating" editorial text) */}
      <div className="relative z-20 mb-4 flex gap-12 opacity-40 px-6 flex-wrap justify-center">
        {CATCHPHRASES.map((word, i) => (
          <span key={i} className="text-[10px] font-black text-white uppercase tracking-[0.5em]">
            {word}
          </span>
        ))}
      </div>

      {/* 3. THE CORE ENGINE (FLIPPED LAYOUT) */}
      <div className="relative z-10 flex items-center justify-center gap-6 md:gap-14 px-6">
        
        {/* LEFT SIDE: Rotating Names */}
        <div className="h-[12vw] w-[35vw] flex items-center justify-end">
          <h2 
            key={index}
            className="text-[9vw] font-black text-[#C69C2B] leading-none tracking-tighter uppercase text-right animate-in fade-in slide-in-from-left-12 duration-500"
          >
            {CUISINES[index]}
          </h2>
        </div>

        {/* THE RED LINE: The Vertical Spine */}
        <div className="w-3 md:w-5 h-[22vw] bg-[#A33B32] shadow-[0_0_50px_rgba(163,59,50,0.4)] rounded-full"></div>

        {/* RIGHT SIDE: Ultimate Dining */}
        <div className="w-[35vw] text-left">
          <h1 className="text-[9vw] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
            ULTIMATE <br/> DINING
          </h1>
        </div>
      </div>

      {/* 4. THE SEARCH: "Find Table" pill (Clean & Minimal) */}
      <div className="relative z-30 mt-16 w-full max-w-md px-6">
        <div className="bg-white rounded-full p-1.5 shadow-2xl flex items-center group transition-all">
          <div className="flex-1 flex items-center px-6 gap-3">
            <span className="text-slate-400" role="img" aria-label="Location">📍</span>
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
              className="w-full py-3 bg-transparent outline-none font-bold text-brand-dark placeholder:text-slate-300 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-brand-dark text-white px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-[#A33B32] transition-colors"
          >
            Find Table
          </button>
        </div>
      </div>

      {/* Sankofa Icon at bottom */}
      <div className="absolute bottom-10 opacity-20">
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
