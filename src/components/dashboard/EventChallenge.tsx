"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseISO, isAfter, isBefore } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Reservation = {
  id: string;
  reservation_date: string;
  status: string;
  restaurant?: {
    id: string;
    name: string;
    cuisine_types?: string[] | null;
  } | null;
};

type ReservationsResp = {
  reservations: Reservation[];
};

type ChallengeStatus = {
  completed: boolean;
  progress: number;
  required: number;
  unlocked: boolean;
};

const CHALLENGE_START = new Date("2026-01-20");
const CHALLENGE_END = new Date("2026-01-31T23:59:59");
const REQUIRED_VISITS = 3;

export function EventChallenge() {
  const queryClient = useQueryClient();

  // Fetch user reservations
  const { data, isLoading } = useQuery<ReservationsResp>({
    queryKey: ["userReservations"],
    queryFn: async () => {
      const res = await fetch("/api/user/reservations");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load reservations");
      return data as ReservationsResp;
    },
  });

  // Check if challenge stamp already exists
  const { data: stampsData } = useQuery<{ stamps: Array<{ id: string; event_type?: string }> }>({
    queryKey: ["userStamps"],
    queryFn: async () => {
      const res = await fetch("/api/user/stamps");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load stamps");
      return data;
    },
  });

  // Calculate challenge progress
  const challengeStatus: ChallengeStatus = React.useMemo(() => {
    if (!data?.reservations) {
      return { completed: false, progress: 0, required: REQUIRED_VISITS, unlocked: false };
    }

    const now = new Date();

    // Filter reservations for Caribbean restaurants during challenge period
    const qualifyingReservations = data.reservations.filter((r) => {
      if (!r.reservation_date || !r.restaurant?.cuisine_types) return false;

      const resDate = parseISO(r.reservation_date);
      const isInDateRange = isAfter(resDate, CHALLENGE_START) && isBefore(resDate, CHALLENGE_END);
      const isCaribbean = r.restaurant.cuisine_types.some(
        (cuisine) =>
          cuisine.toLowerCase().includes("caribbean") ||
          cuisine.toLowerCase().includes("jamaican") ||
          cuisine.toLowerCase().includes("trinidadian") ||
          cuisine.toLowerCase().includes("haitian")
      );
      const isCompleted = r.status === "completed" || isBefore(resDate, now);

      return isInDateRange && isCaribbean && isCompleted;
    });

    // Get unique restaurants visited
    const uniqueRestaurants = new Set(qualifyingReservations.map((r) => r.restaurant?.id).filter(Boolean));
    const progress = uniqueRestaurants.size;
    const completed = progress >= REQUIRED_VISITS;

    // Check if stamp already unlocked
    const hasStamp = stampsData?.stamps?.some((s) => s.event_type === "carnival_2026") || false;

    return {
      completed,
      progress,
      required: REQUIRED_VISITS,
      unlocked: hasStamp,
    };
  }, [data, stampsData]);

  // Unlock stamp when challenge is complete
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (challengeStatus.completed && !challengeStatus.unlocked && !isUnlocking) {
      unlockStamp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeStatus.completed, challengeStatus.unlocked]);

  async function unlockStamp() {
    if (challengeStatus.unlocked || isUnlocking) return;

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const res = await fetch("/api/user/stamps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event_type: "carnival_2026",
          stamp_name: "Carnival '26",
          stamp_description: "Heritage Series - Completed the Carnival Route challenge",
          is_rare: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to unlock stamp");

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["userStamps"] });
      queryClient.invalidateQueries({ queryKey: ["userReservations"] });
    } catch (error) {
      console.error("Failed to unlock stamp:", error);
      setUnlockError(error instanceof Error ? error.message : "Failed to unlock stamp");
    } finally {
      setIsUnlocking(false);
    }
  }

  const progressPercent = Math.min((challengeStatus.progress / challengeStatus.required) * 100, 100);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-1 border-2 border-dashed border-brand-ochre rounded-[3.5rem]">
        <div className="bg-white rounded-[3rem] p-8 md:p-12">
          <div className="animate-pulse space-y-4">
            <div className="h-48 w-48 rounded-full bg-slate-200 mx-auto"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-12 p-1 border-2 border-dashed border-brand-ochre rounded-[3.5rem]">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 overflow-hidden relative">
        {/* Event Badge - Floating */}
        <div className="absolute top-8 right-8 rotate-12 bg-brand-mutedRed text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg z-20">
          Limited Time
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
          {/* The Rare Stamp Preview */}
          <div className="relative group">
            <div
              className={`h-48 w-48 rounded-full bg-gradient-to-tr from-brand-forest via-brand-ochre to-brand-mutedRed p-1 ${
                challengeStatus.unlocked ? "animate-spin-slow" : ""
              } group-hover:pause`}
            >
              <div className="h-full w-full rounded-full bg-white flex flex-col items-center justify-center border-4 border-dashed border-slate-100">
                <span className="text-4xl mb-1">🎭</span>
                <p className="text-[10px] font-black text-brand-dark uppercase tracking-tighter">Carnival &apos;26</p>
                <p className="text-[8px] font-bold text-brand-bronze uppercase">Heritage Series</p>
              </div>
            </div>
            {/* Glossy Overlay Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full pointer-events-none"></div>
            {challengeStatus.unlocked && (
              <div className="absolute -top-2 -right-2 bg-brand-forest text-white rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-lg">
                ✓
              </div>
            )}
          </div>

          {/* Challenge Text */}
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-sm font-black text-brand-mutedRed uppercase tracking-[0.3em] mb-2">Heritage Challenge</h3>
            <h2 className="text-4xl font-black text-brand-dark uppercase tracking-tighter mb-4">
              The Carnival <span className="text-brand-ochre">Route</span>
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed italic">
              &quot;Collect the 2026 Carnival Stamp by dining at any 3 Caribbean partners this week. Unlock exclusive
              invites to the Summer Gala.&quot;
            </p>

            {unlockError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{unlockError}</AlertDescription>
              </Alert>
            )}

            {challengeStatus.unlocked ? (
              <div className="space-y-4">
                <div className="bg-brand-forest/10 border-2 border-brand-forest rounded-2xl p-6 text-center">
                  <p className="text-lg font-black text-brand-dark uppercase mb-2">🎉 Challenge Complete!</p>
                  <p className="text-sm text-slate-600">
                    You&apos;ve unlocked the rare Carnival &apos;26 stamp. Check your Passport Gallery to see it!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Progress Tracker */}
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-brand-dark">
                      {challengeStatus.progress} / {challengeStatus.required} Visited
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-forest to-brand-ochre transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  {challengeStatus.progress > 0 && (
                    <p className="text-xs text-slate-500 italic">
                      {challengeStatus.required - challengeStatus.progress} more Caribbean restaurant
                      {challengeStatus.required - challengeStatus.progress === 1 ? "" : "s"} to go!
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
