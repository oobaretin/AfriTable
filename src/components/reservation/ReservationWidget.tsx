"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime12h } from "@/lib/utils/time-format";

type Slot = {
  time: string;
  availableTables: number;
  status: "available" | "limited" | "unavailable";
};

type AvailabilityResponse = {
  date: string;
  partySize: number;
  slotDurationMinutes: number;
  eligibleTableCount: number;
  slots: Slot[];
};

export function ReservationWidget({
  restaurantId,
  restaurantSlug,
  restaurantName,
}: {
  restaurantId: string;
  restaurantSlug?: string;
  restaurantName?: string;
}) {
  const router = useRouter();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [guests, setGuests] = React.useState(2);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  const dateStr = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  const partySize = String(guests);

  const { data, isLoading, isFetching, error, refetch } = useQuery<AvailabilityResponse>({
    queryKey: ["availability", restaurantId, dateStr, partySize],
    queryFn: async () => {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/availability?date=${encodeURIComponent(dateStr)}&partySize=${encodeURIComponent(partySize)}`,
      );
      if (!res.ok) {
        let details = "";
        try {
          const body = await res.json();
          details = body?.error ? String(body.error) : body?.message ? String(body.message) : "";
        } catch {
          // ignore
        }
        throw new Error(details ? `Failed to load availability: ${details}` : "Failed to load availability");
      }
      return (await res.json()) as AvailabilityResponse;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  React.useEffect(() => {
    setSelectedTime(null);
  }, [dateStr, partySize]);

  const slots = data?.slots ?? [];
  const availableSlots = slots.filter((s) => s.status !== "unavailable");

  const handleReserve = () => {
    if (!selectedTime || !restaurantSlug) return;
    const params = new URLSearchParams();
    params.set("restaurant", restaurantSlug);
    params.set("date", dateStr);
    params.set("time", selectedTime);
    params.set("party", partySize);
    router.push(`/reservations/new?${params.toString()}`);
  };

  // Generate time options (7:00 PM - 10:30 PM in 30-min intervals)
  const timeOptions = React.useMemo(() => {
    const times: string[] = [];
    for (let h = 19; h <= 22; h++) {
      for (const m of [0, 30]) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h3 className="text-xl font-bold text-slate-900 mb-6">
        {restaurantName ? `Reserve at ${restaurantName}` : "Make a Reservation"}
      </h3>

      <div className="space-y-4">
        {/* Guest Count Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Guests</label>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              −
            </button>
            <span className="text-lg font-bold text-slate-900">
              {guests} {guests === 1 ? "Guest" : "Guests"}
            </span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(20, guests + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Date</label>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium text-left focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all hover:bg-slate-50"
                >
                  {date ? format(date, "MMM d, yyyy") : "Select date"}
                </button>
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Time</label>
            {isLoading ? (
              <Skeleton className="h-[42px] w-full rounded-xl" />
            ) : (
              <select
                value={selectedTime || ""}
                onChange={(e) => setSelectedTime(e.target.value || null)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all bg-white"
              >
                <option value="">Select time</option>
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <option key={slot.time} value={slot.time}>
                      {formatTime12h(slot.time)}
                      {slot.status === "limited" && " (Limited)"}
                    </option>
                  ))
                ) : (
                  timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {formatTime12h(time)}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">Couldn&apos;t load availability. Please try again.</p>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleReserve}
          disabled={!selectedTime || !restaurantSlug || isLoading}
          className="group relative w-full overflow-hidden rounded-xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
        >
          <span className="relative z-10">Find a Table</span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-orange-600 to-orange-500 transition-transform duration-300 group-hover:translate-x-0"></div>
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Powered by <span className="font-bold text-orange-500/80 uppercase">AfriTable</span> Secure Booking
      </p>
    </div>
  );
}
