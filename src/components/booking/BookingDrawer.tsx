"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { X, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GuestCheckoutForm } from "@/components/reservation/GuestCheckoutForm";
import { formatTime12h } from "@/lib/utils/time-format";
import type { OpenBookingDrawerOptions } from "@/lib/booking-drawer-types";

type BookingDrawerProps = {
  drawerState: OpenBookingDrawerOptions | null;
  isOpen: boolean;
  onClose: () => void;
};

type DrawerStep = "details" | "guest";

type Slot = {
  time: string;
  availableTables: number;
  status: "available" | "limited" | "unavailable";
};

type AvailabilityResponse = {
  slots: Slot[];
};

function resolveInitialStep(state: OpenBookingDrawerOptions | null): DrawerStep {
  if (!state) return "details";
  if (state.initialStep === "guest") return "guest";
  const sel = state.selection;
  if (sel?.date && sel?.time && sel?.party) return "guest";
  return "details";
}

export function BookingDrawer({ drawerState, isOpen, onClose }: BookingDrawerProps) {
  const router = useRouter();
  const restaurant = drawerState?.restaurant ?? null;

  const [step, setStep] = React.useState<DrawerStep>("details");
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [guests, setGuests] = React.useState(2);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !drawerState) return;
    const nextStep = resolveInitialStep(drawerState);
    setStep(nextStep);

    const sel = drawerState.selection;
    if (sel?.date) {
      setDate(parseISO(sel.date));
    } else {
      setDate(new Date());
    }
    setGuests(sel?.party ? Number(sel.party) : 2);
    setSelectedTime(sel?.time ?? null);
  }, [isOpen, drawerState]);

  React.useEffect(() => {
    if (!isOpen) {
      setStep("details");
      setDate(undefined);
      setGuests(2);
      setSelectedTime(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const dateStr = date ? format(date, "yyyy-MM-dd") : "";
  const partySize = String(guests);
  const restaurantApiId = restaurant?.id ?? "";

  const { data, isLoading, error } = useQuery<AvailabilityResponse>({
    queryKey: ["drawer-availability", restaurantApiId, dateStr, partySize],
    queryFn: async () => {
      const res = await fetch(
        `/api/restaurants/${encodeURIComponent(restaurantApiId)}/availability?date=${encodeURIComponent(dateStr)}&partySize=${encodeURIComponent(partySize)}`,
      );
      if (!res.ok) throw new Error("Failed to load availability");
      return (await res.json()) as AvailabilityResponse;
    },
    enabled: isOpen && Boolean(restaurantApiId && dateStr && step === "details"),
    staleTime: 15_000,
  });

  const slots = React.useMemo(() => data?.slots ?? [], [data?.slots]);

  React.useEffect(() => {
    if (isLoading || error || !slots.length || step !== "details") return;
    if (selectedTime) {
      const slot = slots.find((s) => s.time === selectedTime);
      const ok = slot && slot.status !== "unavailable" && slot.availableTables > 0;
      if (ok) return;
    }
    const first = slots.find((s) => s.status !== "unavailable" && s.availableTables > 0);
    setSelectedTime(first?.time ?? null);
  }, [dateStr, partySize, slots, isLoading, error, selectedTime, step]);

  function handleDetailsContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime || !dateStr) return;
    setStep("guest");
  }

  function handleBookingSuccess(confirmation: { id: string; confirmationCode: string }) {
    if (!restaurant || !dateStr || !selectedTime) return;
    onClose();
    const successParams = new URLSearchParams({
      restaurant: restaurant.slug,
      date: dateStr,
      time: selectedTime,
      party: partySize,
      code: confirmation.confirmationCode,
      id: confirmation.id,
    });
    router.push(`/reservation-success?${successParams.toString()}`);
  }

  if (!restaurant) return null;

  const summary = {
    restaurant: {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      address: restaurant.address ?? "",
      phone: restaurant.phone ?? null,
      image: restaurant.image ?? null,
    },
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} aria-hidden />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md transform shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`Book at ${restaurant.name}`}
      >
        <div className="absolute inset-0 bg-[#050A18]/95 backdrop-blur-xl" />

        <div className="relative flex h-full flex-col overflow-y-auto">
          <div className="flex items-start justify-between border-b border-white/10 p-6">
            <div className="min-w-0 flex-1 pr-4">
              {step === "guest" ? (
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Change date &amp; time
                </button>
              ) : null}
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.4em] text-[#C69C2B]">
                {step === "details" ? "Book a table" : "Confirm details"}
              </p>
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">{restaurant.name}</h2>
              {dateStr && selectedTime && step === "guest" ? (
                <p className="mt-2 text-sm text-white/60">
                  {format(parseISO(dateStr), "EEE, MMM d")} · {formatTime12h(selectedTime)} · {guests}{" "}
                  {guests === 1 ? "guest" : "guests"}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close booking drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 p-6">
            {step === "details" ? (
              <form onSubmit={handleDetailsContinue} className="space-y-6">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-[#C69C2B]">
                    Guests
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-2">
                    <button
                      type="button"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                    >
                      −
                    </button>
                    <span className="text-lg font-bold text-white">
                      {guests} {guests === 1 ? "Guest" : "Guests"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-[#C69C2B]">
                    Date
                  </label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-left text-sm font-semibold text-white hover:bg-white/10"
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
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-[#C69C2B]">
                    Time
                  </label>
                  {isLoading ? (
                    <Skeleton className="h-[42px] w-full rounded-xl bg-white/10" />
                  ) : error ? (
                    <p className="text-sm text-red-300">Couldn&apos;t load times. Try another date.</p>
                  ) : slots.length > 0 ? (
                    <select
                      value={selectedTime ?? ""}
                      onChange={(e) => setSelectedTime(e.target.value || null)}
                      required
                      className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm font-semibold text-white focus:border-[#C69C2B] focus:outline-none"
                    >
                      <option value="" className="bg-[#050A18]">
                        Select time
                      </option>
                      {slots.map((slot) => {
                        const bookable = slot.status !== "unavailable" && slot.availableTables > 0;
                        return (
                          <option
                            key={slot.time}
                            value={slot.time}
                            disabled={!bookable}
                            className="bg-[#050A18]"
                          >
                            {formatTime12h(slot.time)}
                            {slot.status === "limited" && bookable ? " (Limited)" : ""}
                            {!bookable ? " (Unavailable)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <p className="text-sm text-white/50">No times available for this date.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedTime || !dateStr || isLoading}
                  className="w-full rounded-full bg-[#A33B32] px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#A33B32]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </form>
            ) : (
              <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
                <GuestCheckoutForm
                  summary={summary}
                  restaurantSlug={restaurant.slug}
                  date={dateStr}
                  time={selectedTime ?? ""}
                  party={partySize}
                  onBack={() => setStep("details")}
                  onSuccess={handleBookingSuccess}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 border-t border-white/10 p-6">
            <div className="relative h-10 w-10">
              <Image src="/logo.png" alt="" fill className="object-contain opacity-80" />
            </div>
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#C69C2B]/80">
              Honoring the Past, Finding your Table
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
