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
      if (/^\\d{5}(-\\d{4})?$/.test(location.trim())) params.set("zip", location.trim());
      else params.set("city", location.trim());
    }
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (partySize) params.set("partySize", partySize);
    if (time) params.set("time", time);
    router.push(`/restaurants?${params.toString()}`);
  }

  return (
    <Card className="relative z-20 mx-auto w-full max-w-5xl border-white/20 bg-background/70 p-4 shadow-xl backdrop-blur md:p-6">
      <div className="grid gap-4 md:grid-cols-12 md:items-end">
        <div className="md:col-span-4">
          <Label htmlFor="location">Location</Label>
          <div ref={locationWrapRef} className="relative">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or ZIP (e.g. Atlanta, 30303)"
              autoComplete="off"
              className="mt-1"
              onFocus={() => setLocationOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setLocationOpen(false);
              }}
            />
            {locationOpen ? (
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
            ) : null}
          </div>
        </div>

        <div className="md:col-span-3">
          <Label>Date</Label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-1 w-full justify-start">
                {date ? format(date, "EEE, MMM d") : "Pick a date"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[360px]">
              <DialogHeader>
                <DialogTitle>Select a date</DialogTitle>
              </DialogHeader>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date() || d > addDays(new Date(), 90)}
                initialFocus
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="md:col-span-2">
          <Label>Party size</Label>
          <Select value={partySize} onValueChange={setPartySize}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
              <SelectItem value="20+">20+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label>Time</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {TIMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {formatTime12h(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-1">
          <Button className="mt-6 w-full" onClick={onSearch} type="button">
            Search
          </Button>
        </div>
      </div>
    </Card>
  );
}

