"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "HAITIAN", "ETHIOPIAN", "JAMAICAN"];

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
    <section className="relative h-screen w-full bg-brand-dark flex flex-col items-center justify-center overflow-hidden">
      {/* 1. The Core Hero Container */}
      <div className="relative z-10 flex items-center justify-center gap-8 md:gap-12 px-6">
        
        {/* LEFT SIDE: Static "ULTIMATE" */}
        <div className="text-right">
          <h1 className="text-[10vw] font-black text-white leading-none tracking-tighter uppercase italic opacity-90">
            ULTIMATE
          </h1>
          <h1 className="text-[10vw] font-black text-white leading-none tracking-tighter uppercase italic opacity-90">
            DINING
          </h1>
        </div>

        {/* THE CENTER: The Thick Red Vertical Line */}
        <div className="w-3 md:w-4 h-[25vw] bg-brand-mutedRed rounded-full shadow-[0_0_30px_rgba(163,59,50,0.4)]"></div>

        {/* RIGHT SIDE: The Rotating Names */}
        <div className="h-[15vw] flex items-center">
          <h2 
            key={index}
            className="text-[10vw] font-black text-brand-ochre leading-none tracking-tighter uppercase animate-in fade-in slide-in-from-top-12 duration-500"
          >
            {CUISINES[index]}
          </h2>
        </div>
      </div>

      {/* 2. The Original Minimal Search (Underlined) */}
      <div className="absolute bottom-24 w-full max-w-xs px-4">
        <div className="flex items-center gap-4 border-b-2 border-white/20 pb-2 group focus-within:border-brand-ochre transition-all">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="3" 
            className="opacity-40 group-focus-within:opacity-100 group-focus-within:stroke-brand-ochre transition-all"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="SEARCH REGION..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="bg-transparent border-none outline-none text-white font-black uppercase tracking-[0.3em] text-[10px] w-full placeholder:text-white/20"
          />
        </div>
      </div>

      {/* 3. Branding */}
      <div className="absolute top-12 left-12">
        <Image
          src="/logo.png"
          alt="Sankofa"
          width={32}
          height={32}
          className="h-8 brightness-0 invert opacity-50"
          priority
        />
      </div>
    </section>
  );
}
