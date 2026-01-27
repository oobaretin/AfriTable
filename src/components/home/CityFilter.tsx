"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

const cities = [
  "All Cities",
  "NYC",
  "Houston",
  "Atlanta",
  "DC",
  "Miami",
  "Chicago",
  "LA",
  "Philadelphia",
  "Seattle",
  "New Orleans",
];

type CityFilterProps = {
  activeCity: string;
  setActiveCity: (city: string) => void;
};

export function CityFilter({ activeCity, setActiveCity }: CityFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (city: string) => {
    setActiveCity(city === "All Cities" ? "" : city);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#050A18] border border-[#C69C2B]/30 text-white px-4 py-2 rounded-full text-sm font-bold transition-all hover:border-[#C69C2B] hover:bg-[#050A18]/90 min-w-[160px] justify-between"
      >
        <span>{activeCity || "Select City"}</span>
        <ChevronDown 
          className={`w-4 h-4 text-[#C69C2B] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 z-20 bg-[#050A18] border border-[#C69C2B]/30 rounded-lg shadow-xl min-w-[160px] overflow-hidden">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => handleSelect(city)}
                className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${
                  (activeCity === "" && city === "All Cities") || activeCity === city
                    ? "bg-[#C69C2B]/20 text-[#C69C2B]"
                    : "text-white hover:bg-white/10 hover:text-[#C69C2B]"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
