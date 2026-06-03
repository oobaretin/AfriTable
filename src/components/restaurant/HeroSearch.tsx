"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { filterCitySuggestions } from "@/lib/hero-city";
import {
  buildRestaurantsDirectoryHref,
  filtersFromHeroSearchInput,
} from "@/lib/restaurant-filter-url";
import { useHeroSearchCity } from "@/components/restaurant/HeroSearchCityContext";

const CUISINES = ["NIGERIAN", "SENEGALESE", "HAITIAN", "ETHIOPIAN", "JAMAICAN"];
const TYPING_SPEED = 100;
const PAUSE_TIME = 2000;

type HeroSearchProps = {
  /** When provided, used as the section id (e.g. "hero-search" for scroll detection). Omit when rendering a second instance (e.g. sticky bar) to avoid duplicate ids. */
  sectionId?: string;
  /** "full" = full hero section (default). "sticky" = search pill only for the sticky bar. */
  variant?: "full" | "sticky";
};

export function HeroSearch({ sectionId, variant = "full" }: HeroSearchProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedCity = useHeroSearchCity();
  const instanceId = React.useId();
  const sectionIdValue = sectionId ?? `${instanceId}-hero-search`;
  const cityInputId = `${instanceId}-hero-city-search`;

  const [index, setIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [localCity, setLocalCity] = React.useState(searchParams.get("city") || "");
  const city = sharedCity?.city ?? localCity;
  const setCity = sharedCity?.setCity ?? setLocalCity;
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (city.trim()) {
      const filtered = filterCitySuggestions(city);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && city.trim().length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [city]);

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
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        if (displayText === currentWord) {
          setTimeout(() => setIsDeleting(true), PAUSE_TIME);
        }
      } else {
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

  function handleSearch(cityOverride?: string) {
    const raw = (cityOverride ?? city).trim();
    const partial = filtersFromHeroSearchInput(raw);

    if (partial.city) {
      setCity(partial.city);
      router.push(buildRestaurantsDirectoryHref(partial));
      return;
    }

    if (partial.q) {
      router.push(buildRestaurantsDirectoryHref(partial));
      return;
    }

    if (typeof window !== "undefined" && window.location.pathname === "/") {
      const restaurantsSection = document.getElementById("restaurants-section");
      if (restaurantsSection) {
        restaurantsSection.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    router.push(buildRestaurantsDirectoryHref());
  }

  function onEnterKey() {
    if (showSuggestions && suggestions.length > 0) {
      const pick = suggestions[0];
      setCity(pick);
      setShowSuggestions(false);
      handleSearch(pick);
      return;
    }
    handleSearch();
  }

  function onSuggestionClick(suggestion: string) {
    setCity(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }

  const pillTheme = variant === "full" ? "dark" : "light";

  const searchPill = (
    <div className="relative w-full">
      <div
        className={
          pillTheme === "dark"
            ? "bg-white rounded-full p-1.5 shadow-2xl flex items-center border border-white/10"
            : "bg-white rounded-full p-1.5 shadow-md flex items-center border border-slate-200 min-w-0"
        }
      >
        <div
          className={
            pillTheme === "dark"
              ? "flex-1 flex items-center px-5 gap-3"
              : "flex-1 flex items-center px-4 md:px-5 gap-2 md:gap-3 min-w-0"
          }
        >
          <span className="text-slate-400 text-sm shrink-0" role="img" aria-label="Location">
            📍
          </span>
          <input
            id={cityInputId}
            name="city"
            ref={inputRef}
            type="text"
            placeholder={pillTheme === "dark" ? "City or restaurant name" : "City or restaurant name"}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 && city.trim().length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEnterKey();
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            className={
              pillTheme === "dark"
                ? "w-full py-2.5 bg-transparent outline-none font-bold text-slate-800 text-sm placeholder:text-slate-300"
                : "w-full min-w-0 py-2 md:py-2.5 bg-transparent outline-none font-bold text-slate-800 text-sm placeholder:text-slate-400"
            }
            aria-label="Search by city or restaurant name"
          />
        </div>
        <button
          type="button"
          onClick={() => handleSearch()}
          className={
            pillTheme === "dark"
              ? "bg-[#111] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-[#A33B32] transition-all pointer-events-auto cursor-pointer relative z-30"
              : "bg-[#111] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full font-black uppercase tracking-widest text-[9px] shrink-0 hover:bg-[#A33B32] transition-all pointer-events-auto cursor-pointer"
          }
          aria-label="Find restaurants for the location or name you entered"
        >
          Find Table
        </button>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={
            pillTheme === "dark"
              ? "absolute top-full mt-2 w-full bg-[#0A1120] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              : "absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
          }
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className={
                pillTheme === "dark"
                  ? "w-full px-6 py-4 text-left text-white hover:bg-[#C69C2B]/10 hover:text-[#C69C2B] transition-colors border-b border-white/5 last:border-b-0 pointer-events-auto cursor-pointer relative z-50"
                  : "w-full px-4 py-3 text-left text-slate-800 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
              }
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
  );

  if (variant === "sticky") {
    return <div className="w-full max-w-3xl mx-auto">{searchPill}</div>;
  }

  return (
    <section
      className="relative z-0 min-h-[80vh] w-full bg-[#000814] flex flex-col items-center justify-center px-4"
      id={sectionIdValue}
      style={{ transform: "translateZ(0)" }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#000814]"
        style={{ willChange: "auto" }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(30deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
              linear-gradient(150deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
              linear-gradient(30deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
              linear-gradient(150deg, #001d3d 12%, transparent 12.5%, transparent 87%, #001d3d 87.5%, #001d3d),
              linear-gradient(60deg, #003566 25%, transparent 25.5%, transparent 75%, #003566 75%, #003566),
              linear-gradient(60deg, #003566 25%, transparent 25.5%, transparent 75%, #003566 75%, #003566)
            `,
            backgroundSize: "40px 70px",
            backgroundPosition: "0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000814]/50 to-[#000814]"
          style={{ transform: "translateZ(0)" }}
        />
      </div>

      <div className="relative z-10 mb-8 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 opacity-30 sm:gap-x-8 md:gap-x-16">
        {["REDEFINED", "AUTHENTIC", "ANCESTRAL"].map((word, i) => (
          <span
            key={i}
            className="text-[10px] font-black text-white uppercase tracking-[0.12em] sm:tracking-[0.22em] md:tracking-[0.32em]"
          >
            {word}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center w-full max-w-7xl">
        <div className="flex-1 text-right pr-6 md:pr-10">
          <h2 className="text-[6vw] md:text-[5.5vw] font-black text-[#C69C2B] leading-none tracking-tighter uppercase">
            {displayText}
            <span className="animate-pulse border-r-2 md:border-r-4 border-[#C69C2B] ml-1 md:ml-2 inline-block h-[0.8em]" />
          </h2>
        </div>
        <div className="w-2 md:w-3 h-[12vw] md:h-[10vw] bg-[#A33B32] shadow-[0_0_30px_rgba(163,59,50,0.4)] rounded-full" />
        <div className="flex-1 text-left pl-6 md:pl-10">
          <h1 className="text-[6vw] md:text-[5.5vw] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
            ULTIMATE <br /> DINING
          </h1>
        </div>
      </div>

      <div className="relative z-10 mt-16 w-full max-w-lg">
        {searchPill}
        <div className="relative z-10 mt-6 flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-4">
          <Link
            href={buildRestaurantsDirectoryHref()}
            className="text-sm font-bold text-white/90 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Browse all restaurants
          </Link>
          <span className="hidden text-white/35 sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="text-xs text-white/55">No city in mind? See the full directory.</span>
        </div>
      </div>
    </section>
  );
}
