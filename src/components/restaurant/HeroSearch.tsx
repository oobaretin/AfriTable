"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "HAITIAN", "ETHIOPIAN", "JAMAICAN"];
const TYPING_SPEED = 150;
const PAUSE_TIME = 2000;

export function HeroSearch() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [city, setCity] = React.useState("");

  React.useEffect(() => {
    const currentWord = CUISINES[index];

    const handleType = () => {
      if (!isDeleting) {
        // Typing
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        if (displayText === currentWord) {
          setTimeout(() => setIsDeleting(true), PAUSE_TIME);
        }
      } else {
        // Deleting
        setDisplayText(currentWord.substring(0, displayText.length - 1));
        if (displayText === "") {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % CUISINES.length);
        }
      }
    };

    const timer = setTimeout(handleType, isDeleting ? 75 : TYPING_SPEED);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, index]);

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
      {/* 1. THE 3D MIDNIGHT BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      {/* 2. CATCHY WORDS (Top Row) */}
      <div className="relative z-20 mb-6 flex gap-10 opacity-30 px-6 flex-wrap justify-center">
        {["REDEFINED", "AUTHENTIC", "ANCESTRAL"].map((word, i) => (
          <span key={i} className="text-[10px] font-black text-white uppercase tracking-[0.5em]">
            {word}
          </span>
        ))}
      </div>

      {/* 3. THE "wonderful" LAYOUT */}
      <div className="relative z-10 flex items-center justify-center gap-6 md:gap-14 px-6">
        
        {/* LEFT: Typing Cuisine Name */}
        <div className="h-[12vw] w-[38vw] flex items-center justify-end">
          <h2 className="text-[9vw] font-black text-[#C69C2B] leading-none tracking-tighter uppercase text-right">
            {displayText}
            <span className="animate-pulse border-r-4 border-[#C69C2B] ml-2 inline-block h-[0.8em]"></span>
          </h2>
        </div>

        {/* THE RED SPINE */}
        <div className="w-3 md:w-5 h-[22vw] bg-[#A33B32] shadow-[0_0_50px_rgba(163,59,50,0.5)] rounded-full"></div>

        {/* RIGHT: Ultimate Dining */}
        <div className="w-[38vw] text-left">
          <h1 className="text-[9vw] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
            ULTIMATE <br/> DINING
          </h1>
        </div>
      </div>

      {/* 4. FIND TABLE PILL */}
      <div className="relative z-30 mt-16 w-full max-w-md px-6">
        <div className="bg-white rounded-full p-2 shadow-2xl flex items-center">
          <div className="flex-1 flex items-center px-6 gap-3">
            <span className="text-slate-400" role="img" aria-label="Location">📍</span>
            <input
              type="text"
              placeholder="Where are you eating?"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full py-3 bg-transparent outline-none font-bold text-brand-dark text-sm placeholder:text-slate-300"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-brand-dark text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-[#A33B32] transition-all active:scale-95"
          >
            Find Table
          </button>
        </div>
      </div>
    </section>
  );
}
