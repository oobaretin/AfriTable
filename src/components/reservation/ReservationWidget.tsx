"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

function formatTime12h(hhmm: string) {
  const [hhRaw, mmRaw] = hhmm.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return hhmm;
  const period = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
}

function slotClasses(status: Slot["status"], selected: boolean) {
  if (status === "unavailable") return cn("bg-muted text-muted-foreground opacity-60", selected && "ring-2 ring-ring");
  if (status === "limited") return cn("bg-[oklch(0.94_0.03_80)] text-foreground", selected && "ring-2 ring-ring");
  return cn("bg-[oklch(0.92_0.05_145)] text-foreground", selected && "ring-2 ring-ring");
}

export function ReservationWidget({
  restaurantId,
  restaurantSlug,
}: {
  restaurantId: string;
  restaurantSlug?: string;
}) {
  const router = useRouter();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [partySize, setPartySize] = React.useState("2");
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  const dateStr = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve a table</CardTitle>
        <CardDescription>Pick a date, party size, and time.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Date</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
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

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Party size</span>
            <Select value={partySize} onValueChange={setPartySize}>
              <SelectTrigger>
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
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Available times</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="grid gap-2">
            <p className="text-sm text-destructive">Couldn’t load availability.</p>
            <p className="text-xs text-muted-foreground">{String((error as any)?.message ?? "")}</p>
          </div>
        ) : slots.length ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-2">
            {slots.map((s) => (
              <button
                key={s.time}
                type="button"
                disabled={s.status === "unavailable"}
                className={cn(
                  "rounded-md px-2 py-2.5 sm:py-2 text-sm font-medium transition hover:brightness-[0.98] disabled:cursor-not-allowed min-h-[44px] sm:min-h-[36px]",
                  slotClasses(s.status, selectedTime === s.time),
                )}
                onClick={() => setSelectedTime(s.time)}
                title={
                  s.status === "available"
                    ? `${s.availableTables} tables available`
                    : s.status === "limited"
                      ? `Limited: ${s.availableTables} left`
                      : "Unavailable"
                }
              >
                {formatTime12h(s.time)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {data?.eligibleTableCount === 0
              ? "No tables can accommodate this party size. Try a smaller party."
              : "No times available for this day."}
          </p>
        )}

        <div className="grid gap-2">
          <Button
            disabled={!selectedTime || !restaurantSlug}
            type="button"
            onClick={() => {
              if (!selectedTime || !restaurantSlug) return;
              const params = new URLSearchParams();
              params.set("restaurant", restaurantSlug);
              params.set("date", dateStr);
              params.set("time", selectedTime);
              params.set("party", partySize);
              router.push(`/reservations/new?${params.toString()}`);
            }}
          >
            Reserve Now
          </Button>
          <p className="text-xs text-muted-foreground">
            Availability updates automatically. Final booking flow will create a reservation record.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

