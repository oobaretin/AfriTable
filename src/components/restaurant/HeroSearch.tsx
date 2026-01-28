"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CUISINES = ["NIGERIAN", "SENEGALESE", "HAITIAN", "ETHIOPIAN", "JAMAICAN"];
const TYPING_SPEED = 100;
const PAUSE_TIME = 2000;

// Available cities from our database
const AVAILABLE_CITIES = [
  "New York City",
  "Houston",
  "Atlanta",
  "Washington D.C.",
  "Miami",
  "Los Angeles",
  "Chicago",
  "Philadelphia",
  "Seattle",
  "Boston",
  "San Francisco",
  "Oakland",
];

export function HeroSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [index, setIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [city, setCity] = React.useState(searchParams.get("city") || "");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Filter cities based on input
  React.useEffect(() => {
    if (city.trim()) {
      const filtered = AVAILABLE_CITIES.filter((c) =>
        c.toLowerCase().includes(city.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && city.trim().length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [city]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    // If on homepage, try to scroll to restaurants section
    if (window.location.pathname === "/") {
      const restaurantsSection = document.getElementById("restaurants-section");
      if (restaurantsSection) {
        restaurantsSection.scrollIntoView({ behavior: "smooth" });
        // Update URL with city filter if provided
        if (city.trim()) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("city", city.trim());
          router.push(`/?${params.toString()}`, { scroll: false });
        }
        return;
      }
    }
    
    // Otherwise, navigate to /restaurants page with city filter
    if (city.trim()) {
      router.push(`/restaurants?city=${encodeURIComponent(city.trim())}`);
    } else {
      router.push("/restaurants");
    }
  }

  return (
    <section className="relative z-0 min-h-[60vh] max-h-[800px] w-full bg-[#050A18] flex flex-col items-center justify-center overflow-hidden px-4 py-24" id="hero-search">
      {/* 1. BACKGROUND PATTERN - Geometric pattern overlay */}
      <div 
        className="absolute inset-0 z-0 bg-[#000814] pointer-events-none"
        style={{
          backgroundColor: '#000814',
          backgroundImage: `
            linear-gradient(30deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
            linear-gradient(150deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
            linear-gradient(30deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
            linear-gradient(150deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
            linear-gradient(60deg, #003566 25%, transparent 25.5%, transparent 75%, #003566 75%, #003566),
            linear-gradient(60deg, #003566 25%, transparent 25.5%, transparent 75%, #003566 75%, #003566)`,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
        }}
      >
        {/* Shadow vignette for 3D depth effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#000814] opacity-90"></div>
      </div>

      {/* 2. BACKGROUND STRUCTURES (Subtler) - pointer-events-none to prevent blocking */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* 2. CATCHY WORDS (Smaller & More Spaced) */}
      <div className="relative z-20 mb-8 flex gap-8 md:gap-16 opacity-30">
        {["REDEFINED", "AUTHENTIC", "ANCESTRAL"].map((word, i) => (
          <span key={i} className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
            {word}
          </span>
        ))}
      </div>

      {/* 4. THE CORE ENGINE (RESIZED) */}
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

      {/* 5. FIND TABLE PILL (Consistent Sizing) */}
      <div className="relative z-30 mt-16 w-full max-w-lg">
        <div className="relative">
          <div className="bg-white rounded-full p-1.5 shadow-2xl flex items-center border border-white/10">
            <div className="flex-1 flex items-center px-5 gap-3">
              <span className="text-slate-400 text-sm" role="img" aria-label="Location">📍</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Where are you eating?"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0 && city.trim().length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (showSuggestions && suggestions.length > 0) {
                      setCity(suggestions[0]);
                      setShowSuggestions(false);
                    } else {
                      handleSearch();
                    }
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                className="w-full py-2.5 bg-transparent outline-none font-bold text-slate-800 text-sm placeholder:text-slate-300"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-[#111] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-[#A33B32] transition-all pointer-events-auto cursor-pointer relative z-30"
            >
              Find Table
            </button>
          </div>

          {/* City Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full mt-2 w-full bg-[#0A1120] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCity(suggestion);
                    setShowSuggestions(false);
                    handleSearch();
                  }}
                  className="w-full px-6 py-4 text-left text-white hover:bg-[#C69C2B]/10 hover:text-[#C69C2B] transition-colors border-b border-white/5 last:border-b-0 pointer-events-auto cursor-pointer relative z-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#A33B32] text-sm">📍</span>
                    <span className="font-bold text-sm">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
