"use client";

import * as React from "react";

const STORAGE_KEY = "afritable_founders_note_seen";

function hasSeenFoundersNote(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markFoundersNoteSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function FoundersNote() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (hasSeenFoundersNote()) return;
    // Show the note once, 2 seconds after the user lands
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = React.useCallback(() => {
    markFoundersNoteSeen();
    setIsVisible(false);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="founders-note fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-right-10 duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        {/* Top Decorative Bar using your logo colors */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="flex-1 bg-brand-mutedRed"></div>
          <div className="flex-1 bg-brand-forest"></div>
          <div className="flex-1 bg-brand-ochre"></div>
        </div>

        <button 
          onClick={handleDismiss}
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
            <h3>A note from the founder</h3>
            <p className="eyebrow">Welcome to the table</p>
          </div>
        </div>

        <blockquote className="founder-quote mb-4">
          I built AfriTable because our food is a language of love, yet it was often the hardest to find and book. This
          platform is my way of ensuring our heritage always has a seat at the center of the global culinary map.
        </blockquote>

        <button
          type="button"
          onClick={handleDismiss}
          className="btn btn-bronze w-full py-2 rounded-lg text-white shadow-md shadow-brand-bronze/20"
        >
          Let&apos;s explore
        </button>
      </div>
    </div>
  );
}
