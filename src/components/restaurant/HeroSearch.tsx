"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "JAMAICAN", "ETHIOPIAN", "GHANAIAN", "HAITIAN"];

export function HeroSearch() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [city, setCity] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

  // Faster rotation for higher energy
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

    setIsSearching(true);

    // Build search params with city
    const params = new URLSearchParams();
    params.set("city", city.trim());

    // Navigate to search results
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center bg-brand-dark overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/kente-cloth.png')]"></div>
      </div>

      {/* Main Identity Text */}
      <div className="relative z-10 text-center select-none">
        <p className="text-brand-bronze font-black uppercase tracking-[0.5em] text-[10px] md:text-xs mb-4 animate-pulse">
          The Future of Heritage
        </p>
        
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-[14vw] md:text-[10vw] font-black text-white leading-[0.8] tracking-tighter uppercase italic">
            Ultimate
          </h1>
          
          {/* THE ROTATING NAME - The "Soul" of the Hero */}
          <div className="h-[15vw] md:h-[11vw] flex items-center justify-center overflow-hidden">
            <h2 
              key={index} // Key ensures the animation re-triggers on every change
              className="text-[14vw] md:text-[10vw] font-black text-brand-ochre leading-none tracking-tighter uppercase animate-in fade-in slide-in-from-bottom-8 duration-500"
            >
              {CUISINES[index]}
            </h2>
          </div>

          <h1 className="text-[14vw] md:text-[10vw] font-black text-white leading-[0.8] tracking-tighter uppercase italic">
            Dining
          </h1>
        </div>
      </div>

      {/* THE FIND TABLE ACTION - Minimalist floating bar */}
      <div className="relative z-30 w-full max-w-xl px-6 mt-16 animate-in fade-in zoom-in duration-1000 delay-500">
        <div className="bg-white/95 backdrop-blur-md rounded-full p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center border border-white/20">
          <div className="flex-1 flex items-center px-6 gap-3">
            <span className="text-lg" role="img" aria-label="Location">📍</span>
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
              className="w-full py-4 bg-transparent outline-none font-bold text-brand-dark placeholder:text-slate-400 text-sm md:text-base"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-brand-dark hover:bg-brand-forest text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Find Table"}
          </button>
        </div>
      </div>

      {/* Branding Anchor */}
      <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-40">
        <Image
          src="/logo.png"
          alt="Sankofa Seal"
          width={32}
          height={32}
          className="h-8 brightness-0 invert"
          priority
        />
      </div>
    </section>
  );
}
