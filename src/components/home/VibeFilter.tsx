"use client";

import * as React from "react";

type VibeOption = "All" | "Fine Dining" | "Authentic Staples" | "Daily Driver";

type VibeFilterProps = {
  selectedVibe: VibeOption;
  onVibeChange: (vibe: VibeOption) => void;
};

export function VibeFilter({ selectedVibe, onVibeChange }: VibeFilterProps) {
  const vibes: VibeOption[] = ["All", "Fine Dining", "Authentic Staples", "Daily Driver"];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {vibes.map((vibe) => {
        const isActive = selectedVibe === vibe;
        return (
          <button
            key={vibe}
            onClick={() => onVibeChange(vibe)}
            className={`
              px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
              ${
                isActive
                  ? "bg-[#C69C2B] text-[#050A18] border-2 border-[#C69C2B] shadow-lg shadow-[#C69C2B]/20"
                  : "bg-white/5 text-white/70 border-2 border-white/10 hover:border-white/20 hover:bg-white/10"
              }
            `}
          >
            {vibe}
          </button>
        );
      })}
    </div>
  );
}
