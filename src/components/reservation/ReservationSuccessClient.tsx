"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  images?: string[];
  cuisine_types?: string[];
  address?: unknown;
};

function extractCity(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") {
    const parts = address.split(",");
    return parts.length > 0 ? parts[parts.length - 2]?.trim() || "" : "";
  }
  if (typeof address === "object" && address !== null) {
    return (address as any).city || "";
  }
  return "";
}

export function ReservationSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantSlug = searchParams.get("restaurant");
  const reservationDate = searchParams.get("date");
  const reservationTime = searchParams.get("time");
  const partySize = searchParams.get("party");

  // Trigger confetti celebration on mount (browser-only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let interval: NodeJS.Timeout | null = null;

    import("canvas-confetti")
      .then((mod) => {
        const confetti = mod.default;
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            if (interval) clearInterval(interval);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          // Left side confetti
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ["#A33B32", "#2D5A27", "#C69C2B"], // brand-mutedRed, brand-forest, brand-ochre
          });
          // Right side confetti
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ["#A33B32", "#2D5A27", "#C69C2B"],
          });
        }, 250);
      })
      .catch(() => {
        // Silently fail if confetti can't be loaded
      });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Fetch restaurant details
  const { data: restaurant, isLoading } = useQuery<Restaurant | null>({
    queryKey: ["restaurant", restaurantSlug],
    queryFn: async () => {
      if (!restaurantSlug) return null;
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from("restaurants_with_rating")
        .select("id, name, slug, images, cuisine_types, address")
        .eq("slug", restaurantSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return null;
      return data as Restaurant;
    },
    enabled: !!restaurantSlug,
  });

  const formattedDate = reservationDate ? format(parseISO(reservationDate), "EEEE, MMMM d") : "";
  const formattedDateShort = reservationDate ? format(parseISO(reservationDate), "MMM d") : "";
  const formattedTime = reservationTime
    ? format(parseISO(`2000-01-01T${reservationTime.slice(0, 5)}:00`), "h:mm a")
    : "";
  const partyCount = partySize ? parseInt(partySize, 10) : 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <Skeleton className="h-40 w-40 rounded-full mx-auto mb-12" />
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-2xl font-black text-brand-dark mb-4">Restaurant not found</h1>
          <Button asChild>
            <Link href="/restaurants">Browse Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Stamp Receipt */}
        <div className="mb-12 relative inline-block">
          <div className="h-40 w-40 rounded-full bg-brand-paper border-4 border-dashed border-brand-bronze/30 flex flex-col items-center justify-center rotate-[-10deg] animate-bounce-subtle mx-auto relative overflow-hidden">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 opacity-20 absolute"
            />
            <p className="text-[10px] font-black text-brand-bronze uppercase tracking-widest mb-1 relative z-10">
              Confirmed
            </p>
            <p className="text-xl font-black text-brand-dark uppercase leading-none relative z-10 text-center px-2">
              {restaurant.name.length > 15 ? restaurant.name.slice(0, 12) + "..." : restaurant.name}
            </p>
            {formattedDateShort && (
              <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase relative z-10">{formattedDateShort}</p>
            )}
          </div>
          {/* Success Checkmark */}
          <div className="absolute bottom-0 right-0 bg-brand-forest text-white h-10 w-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
            ✓
          </div>
        </div>

        <h1 className="text-5xl font-black text-brand-dark uppercase tracking-tighter mb-4">
          Your Table <br /> <span className="text-brand-forest">is Waiting.</span>
        </h1>

        <p className="text-lg text-slate-600 mb-10 italic">
          A confirmation email has been sent. Your digital passport has been updated with your new stamp.
        </p>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <div className="p-6 rounded-[2rem] bg-brand-paper border border-brand-bronze/10 text-left">
            <p className="text-[10px] font-black text-brand-bronze uppercase mb-2">The Details</p>
            <p className="text-sm font-bold text-brand-dark">
              {formattedDate} {formattedTime && `@ ${formattedTime}`}
            </p>
            <p className="text-xs text-slate-500">
              {partyCount} {partyCount === 1 ? "Guest" : "Guests"} • {restaurant.name}
            </p>
          </div>
          <div className="p-6 rounded-[2rem] bg-brand-paper border border-brand-bronze/10 text-left">
            <p className="text-[10px] font-black text-brand-bronze uppercase mb-2">Next Step</p>
            <button
              onClick={() => {
                // Generate calendar link
                if (reservationDate && reservationTime) {
                  const startDate = new Date(`${reservationDate}T${reservationTime.slice(0, 5)}:00`);
                  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
                  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Reservation at ${encodeURIComponent(restaurant.name)}&dates=${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}&details=Reservation confirmed via AfriTable`;
                  window.open(googleUrl, "_blank");
                }
              }}
              className="text-sm font-bold text-brand-dark underline hover:text-brand-bronze transition-colors"
            >
              Add to Calendar
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="btn-bronze px-10 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-bronze/20"
          >
            <Link href="/passport">View My Passport</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="px-10 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
          >
            <Link href="/">Return Home</Link>
          </Button>
        </div>

        <p className="mt-16 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Thank you for supporting Diaspora Dining
        </p>
      </div>
    </div>
  );
}
