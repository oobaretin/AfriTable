"use client";

import * as React from "react";

const categories = ["All", "Nigerian", "Ethiopian", "Jamaican", "Haitian", "Ghanaian", "Senegalese", "Kenyan", "Somali", "Eritrean"];

type CategoryFilterProps = {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  isSticky?: boolean;
};

export function CategoryFilter({ activeCategory, setActiveCategory, isSticky = false }: CategoryFilterProps) {
  const filterClasses = isSticky
    ? "sticky top-0 z-30 bg-[#050A18]/80 backdrop-blur-md border-b border-white/10 py-4"
    : "pb-6";

  return (
    <div className={`flex items-center gap-3 overflow-x-auto ${filterClasses} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
      <div className="mx-auto max-w-6xl w-full px-6 flex items-center gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap rounded-full px-6 py-2 text-sm font-bold transition-all border ${
              activeCategory === category
                ? "bg-[#C69C2B] text-[#050A18] border-[#C69C2B] shadow-md"
                : "bg-white/10 text-white border-white/20 hover:border-[#C69C2B]/50 hover:text-[#C69C2B]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
