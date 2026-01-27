"use client";

import * as React from "react";

const categories = ["All", "Nigerian", "Ethiopian", "Jamaican", "Haitian", "Ghanaian", "Senegalese"];

type CategoryFilterProps = {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
};

export function CategoryFilter({ activeCategory, setActiveCategory }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-6 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setActiveCategory(category)}
          className={`whitespace-nowrap rounded-full px-6 py-2 text-sm font-bold transition-all border ${
            activeCategory === category
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white text-slate-600 border-slate-200 hover:border-orange-500 hover:text-orange-500"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
