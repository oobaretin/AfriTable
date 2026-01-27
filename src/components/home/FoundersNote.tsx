"use client";

import * as React from "react";

export function FoundersNote() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Show the note 2 seconds after the user lands
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-right-10 duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        {/* Top Decorative Bar using your logo colors */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="flex-1 bg-brand-mutedRed"></div>
          <div className="flex-1 bg-brand-forest"></div>
          <div className="flex-1 bg-brand-ochre"></div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-brand-bronze/10 flex items-center justify-center border border-brand-bronze/20">
            {/* Small version of the Sankofa bird or a founder headshot */}
            <span className="text-xl">✍🏾</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">A Note from the Founder</h4>
            <p className="text-xs text-brand-bronze font-bold">Welcome to the Table</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">
          &quot;I built AfriTable because our food is a language of love, yet it was often the hardest to find and book. This platform is my way of ensuring our heritage always has a seat at the center of the global culinary map.&quot;
        </p>

        <button 
          onClick={() => setIsVisible(false)}
          className="w-full btn-bronze py-2 rounded-lg text-xs font-bold text-white uppercase tracking-widest shadow-md shadow-brand-bronze/20"
        >
          Let&apos;s Explore
        </button>
      </div>
    </div>
  );
}
