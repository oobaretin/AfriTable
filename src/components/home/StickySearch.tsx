"use client";

import * as React from "react";
import { HeroSearch } from "@/components/restaurant/HeroSearch";

export function StickySearch() {
  const [isSticky, setIsSticky] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const heroSearch = document.getElementById("hero-search");
      if (!heroSearch) return;
      
      const heroBottom = heroSearch.getBoundingClientRect().bottom;
      setIsSticky(heroBottom < 0);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isSticky) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-slate-200 px-6 py-4 animate-in slide-in-from-top duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-2 bg-white p-2 rounded-xl shadow-md max-w-3xl mx-auto">
          <HeroSearch />
        </div>
      </div>
    </div>
  );
}
