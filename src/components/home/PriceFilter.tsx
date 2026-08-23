"use client";

const PRICE_OPTIONS = [
  { label: "All", value: null as number | null },
  { label: "$$", value: 2 },
  { label: "$$$", value: 3 },
  { label: "$$$$", value: 4 },
];

export function PriceFilter({
  activePrice,
  setActivePrice,
}: {
  activePrice: number | null;
  setActivePrice: (price: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 shrink-0">Price</span>
      {PRICE_OPTIONS.map((opt) => {
        const isActive = activePrice === opt.value;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => setActivePrice(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-[#C69C2B] text-[#050A18]"
                : "border border-white/10 bg-white/5 text-white/70 hover:border-[#C69C2B]/40 hover:text-white"
            }`}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
