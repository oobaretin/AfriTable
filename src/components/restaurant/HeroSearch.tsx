"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime12h } from "@/lib/utils/time-format";

const POPULAR_LOCATIONS = [
  "Houston, TX",
  "Atlanta, GA",
  "Washington, DC",
  "New York, NY",
  "Los Angeles, CA",
  "Dallas, TX",
  "Chicago, IL",
  "Philadelphia, PA",
];

function times30m() {
  const times: string[] = [];
  for (let h = 7; h <= 22; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
}

const TIMES = times30m();

export function HeroSearch() {
  const router = useRouter();

  const [location, setLocation] = React.useState("");
  const [cuisine, setCuisine] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [partySize, setPartySize] = React.useState("2");
  const [time, setTime] = React.useState("19:00");
  const [locationOpen, setLocationOpen] = React.useState(false);
  const locationWrapRef = React.useRef<HTMLDivElement | null>(null);

  const suggestions = React.useMemo(() => {
    const q = location.trim().toLowerCase();
    if (!q) return POPULAR_LOCATIONS.slice(0, 6);
    return POPULAR_LOCATIONS.filter((l) => l.toLowerCase().includes(q)).slice(0, 6);
  }, [location]);

  React.useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = locationWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setLocationOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function onSearch() {
    const params = new URLSearchParams();
    if (location.trim()) {
      // very light heuristic for city vs zip
      if (/^\d{5}(-\d{4})?$/.test(location.trim())) params.set("zip", location.trim());
      else params.set("city", location.trim());
    }
    if (cuisine.trim()) {
      params.set("cuisine", cuisine.trim());
    }
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (partySize) params.set("partySize", partySize);
    if (time) params.set("time", time);
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <>
      <input
        type="text"
        placeholder="Cuisine or Restaurant"
        value={cuisine}
        onChange={(e) => setCuisine(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
        className="flex-1 px-6 py-4 text-slate-900 focus:outline-none rounded-xl"
      />
      <div ref={locationWrapRef} className="relative flex-1">
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onFocus={() => setLocationOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
            if (e.key === "Escape") setLocationOpen(false);
          }}
          className="w-full px-6 py-4 text-slate-900 border-l border-slate-100 focus:outline-none rounded-xl md:rounded-none"
        />
        {locationOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setLocation(s);
                  setLocationOpen(false);
                }}
              >
                <span>{s}</span>
                <span className="text-xs text-muted-foreground">Popular</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onSearch}
        className="btn-bronze px-10 py-4 rounded-xl font-bold text-white uppercase tracking-widest text-sm"
      >
        Search
      </button>
    </>
  );
}
