"use client";

import { useQuery } from "@tanstack/react-query";

type Slot = {
  time: string;
  availableTables: number;
  status: "available" | "limited" | "unavailable";
};

type AvailabilityResponse = {
  slots: Slot[];
};

export function useAvailability(params: {
  restaurantId: string;
  date: string; // yyyy-mm-dd
  partySize: string; // "1".."20"|"20+"
}) {
  return useQuery<AvailabilityResponse>({
    queryKey: ["availability", params.restaurantId, params.date, params.partySize],
    queryFn: async () => {
      const res = await fetch(
        `/api/restaurants/${params.restaurantId}/availability?date=${encodeURIComponent(params.date)}&partySize=${encodeURIComponent(params.partySize)}`,
      );
      if (!res.ok) throw new Error("Failed to load availability");
      return (await res.json()) as AvailabilityResponse;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function AvailabilityChecker(props: {
  restaurantId: string;
  date: string;
  time: string; // HH:mm
  partySize: string;
  children: (state: { available: boolean; availableTables: number }) => React.ReactNode;
}) {
  const q = useAvailability({
    restaurantId: props.restaurantId,
    date: props.date,
    partySize: props.partySize,
  });

  const slots = q.data?.slots ?? [];
  const match = slots.find((s) => s.time === props.time);
  const availableTables = match?.availableTables ?? 0;
  const available = Boolean(match && match.status !== "unavailable" && availableTables > 0);

  return <>{props.children({ available, availableTables })}</>;
}

