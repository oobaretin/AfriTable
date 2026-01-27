"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "HAITIAN", "ETHIOPIAN", "JAMAICAN"];
const TYPING_SPEED = 100;
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

    const timer = setTimeout(handleType, isDeleting ? 50 : TYPING_SPEED);
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
    <section className="relative h-screen w-full bg-[#050A18] flex flex-col items-center justify-center overflow-hidden px-4">
      {/* 1. BACKGROUND STRUCTURES (Subtler) */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
      </div>

      {/* 2. CATCHY WORDS (Smaller & More Spaced) */}
      <div className="relative z-20 mb-8 flex gap-8 md:gap-16 opacity-30">
        {["REDEFINED", "AUTHENTIC", "ANCESTRAL"].map((word, i) => (
          <span key={i} className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
            {word}
          </span>
        ))}
      </div>

      {/* 3. THE CORE ENGINE (RESIZED) */}
      <div className="relative z-10 flex items-center justify-center w-full max-w-7xl">
        
        {/* LEFT: Typing (Reduced Size) */}
        <div className="flex-1 text-right pr-6 md:pr-10">
          <h2 className="text-[6vw] md:text-[5.5vw] font-black text-[#C69C2B] leading-none tracking-tighter uppercase">
            {displayText}
            <span className="animate-pulse border-r-2 md:border-r-4 border-[#C69C2B] ml-1 md:ml-2 inline-block h-[0.8em]"></span>
          </h2>
        </div>

        {/* THE RED SPINE (Thinner & Scaled) */}
        <div className="w-2 md:w-3 h-[12vw] md:h-[10vw] bg-[#A33B32] shadow-[0_0_30px_rgba(163,59,50,0.4)] rounded-full"></div>

        {/* RIGHT: Ultimate Dining (Reduced Size) */}
        <div className="flex-1 text-left pl-6 md:pl-10">
          <h1 className="text-[6vw] md:text-[5.5vw] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
            ULTIMATE <br/> DINING
          </h1>
        </div>
      </div>

      {/* 4. FIND TABLE PILL (Consistent Sizing) */}
      <div className="relative z-30 mt-16 w-full max-w-lg">
        <div className="bg-white rounded-full p-1.5 shadow-2xl flex items-center border border-white/10">
          <div className="flex-1 flex items-center px-5 gap-3">
            <span className="text-slate-400 text-sm" role="img" aria-label="Location">📍</span>
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
              className="w-full py-2.5 bg-transparent outline-none font-bold text-slate-800 text-sm placeholder:text-slate-300"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#111] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-[#A33B32] transition-all"
          >
            Find Table
          </button>
        </div>
      </div>
    </section>
  );
}
