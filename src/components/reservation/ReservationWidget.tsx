"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime12h } from "@/lib/utils/time-format";
import { BookingStatusBadge } from "@/components/restaurant/BookingStatusBadge";
import { resolveBookingAction } from "@/lib/booking-action";

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
  const [redirecting, setRedirecting] = React.useState(false);
  const bookingAction = resolveBookingAction({
    isLivePartner: true,
    isClaimed: true,
    onlineReservationsEnabled: true,
  });

  const dateStr = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  const partySize = String(guests);

  const { data, isLoading, error } = useQuery<AvailabilityResponse>({
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

  const slots = data?.slots ?? [];

  React.useEffect(() => {
    if (isLoading || error || !data?.slots?.length) return;
    if (selectedTime) {
      const slot = data.slots.find((s) => s.time === selectedTime);
      const ok = slot && slot.status !== "unavailable" && slot.availableTables > 0;
      if (ok) return;
    }
    const first = data.slots.find((s) => s.status !== "unavailable" && s.availableTables > 0);
    setSelectedTime(first?.time ?? null);
  }, [dateStr, partySize, data, isLoading, error, selectedTime]);

  const handleReserve = () => {
    if (!selectedTime || !restaurantSlug) return;

    setRedirecting(true);
    const params = new URLSearchParams();
    params.set("restaurant", restaurantSlug);
    params.set("date", dateStr);
    params.set("time", selectedTime);
    params.set("party", partySize);
    router.push(`/reservations/new?${params.toString()}`);
  };

  if (redirecting) {
    return (
      <div id="book" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="py-8 text-center">
          <h3 className="mb-2 text-xl font-bold text-slate-900">Continuing to confirm…</h3>
          <p className="text-sm text-slate-500">
            Your table isn&apos;t held yet — finish the next step to confirm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="book" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-3">
        <BookingStatusBadge action={bookingAction} />
      </div>
      <h3 className="mb-1 text-xl font-bold text-slate-900">
        {restaurantName ? `Book at ${restaurantName}` : "Book a table"}
      </h3>
      <p className="mb-4 text-sm text-slate-500">{bookingAction.description}</p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Guests</label>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
            >
              −
            </button>
            <span className="text-lg font-bold text-slate-900">
              {guests} {guests === 1 ? "Guest" : "Guests"}
            </span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(20, guests + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 p-3 text-left text-sm font-medium transition-all hover:bg-slate-50 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Time</label>
            {isLoading ? (
              <Skeleton className="h-[42px] w-full rounded-xl" />
            ) : error ? (
              <select
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-500"
                aria-label="Time"
              >
                <option value="">Load times to continue</option>
              </select>
            ) : slots.length > 0 ? (
              <select
                value={selectedTime || ""}
                onChange={(e) => setSelectedTime(e.target.value || null)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium transition-all focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                aria-label="Time"
              >
                <option value="">Select time</option>
                {slots.map((slot) => {
                  const bookable = slot.status !== "unavailable" && slot.availableTables > 0;
                  return (
                    <option key={slot.time} value={slot.time} disabled={!bookable}>
                      {formatTime12h(slot.time)}
                      {slot.status === "limited" && bookable ? " (Limited)" : ""}
                      {!bookable ? " (Unavailable)" : ""}
                    </option>
                  );
                })}
              </select>
            ) : (
              <select
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-500"
                aria-label="Time"
              >
                <option value="">No times for this date</option>
              </select>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">Couldn&apos;t load availability. Please try again.</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleReserve}
          disabled={!selectedTime || !restaurantSlug || isLoading}
          className="btn-bronze w-full rounded-xl px-10 py-4 text-sm font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          Continue to book
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Live availability · AfriTable partner
      </p>
    </div>
  );
}
