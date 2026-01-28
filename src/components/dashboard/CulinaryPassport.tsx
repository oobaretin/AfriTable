"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InstagramStoryExport } from "./InstagramStoryExport";

type Reservation = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    cuisine_types: string[];
    address: unknown;
    images: string[];
  };
};

type ReservationsResp = {
  reservations: Reservation[];
};

type Stamp = {
  id: string;
  restaurant: string;
  restaurantSlug?: string;
  city: string;
  date: string;
  color: string;
  cuisine?: string;
  isEvent?: boolean;
  emoji?: string;
};

// Generate stamp color based on cuisine/region
function getStampColor(cuisineTypes: string[] | null | undefined, index: number): string {
  if (!cuisineTypes || cuisineTypes.length === 0) {
    const colors = ["bg-brand-mutedRed", "bg-brand-forest", "bg-brand-ochre"];
    return colors[index % colors.length];
  }

  const cuisine = cuisineTypes[0]?.toLowerCase() || "";
  
  // West African cuisines - Red
  if (cuisine.includes("nigerian") || cuisine.includes("ghanaian") || cuisine.includes("senegalese")) {
    return "bg-brand-mutedRed";
  }
  
  // East African cuisines - Green
  if (cuisine.includes("ethiopian") || cuisine.includes("eritrean") || cuisine.includes("somali") || cuisine.includes("kenyan")) {
    return "bg-brand-forest";
  }
  
  // Caribbean cuisines - Gold/Ochre
  if (cuisine.includes("jamaican") || cuisine.includes("trinidadian") || cuisine.includes("haitian") || cuisine.includes("caribbean")) {
    return "bg-brand-ochre";
  }
  
  // Default rotation
  const colors = ["bg-brand-mutedRed", "bg-brand-forest", "bg-brand-ochre"];
  return colors[index % colors.length];
}

// Extract city from address
function extractCity(address: unknown): string {
  if (!address) return "Unknown";
  if (typeof address === "string") {
    const parts = address.split(",");
    return parts.length > 1 ? parts[parts.length - 2]?.trim() || "Unknown" : "Unknown";
  }
  if (typeof address === "object" && address !== null) {
    return (address as any).city || "Unknown";
  }
  return "Unknown";
}

export function CulinaryPassport() {
  const { data, isLoading, error } = useQuery<ReservationsResp>({
    queryKey: ["userReservations"],
    queryFn: async () => {
      const res = await fetch("/api/user/reservations");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load reservations");
      return data as ReservationsResp;
    },
  });

  // Fetch user profile for name
  const { data: profileData } = useQuery<{ profile: { full_name: string | null } }>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load profile");
      return data;
    },
  });

  // Fetch event stamps (like Carnival challenge) - kept for future use
  // const { data: stampsData } = useQuery<{ stamps: Array<{ id: string; event_type?: string; created_at: string }> }>({
  //   queryKey: ["userStamps"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/user/stamps");
  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data?.message || "Failed to load stamps");
  //     return data;
  //   },
  // });

  // Memoize reservations to prevent infinite re-renders
  const reservations = React.useMemo(() => {
    return data?.reservations ?? [];
  }, [data?.reservations]);

  // Memoize now to prevent infinite re-renders
  const now = React.useMemo(() => {
    return new Date();
  }, []);

  // Separate upcoming and past reservations
  const upcoming = React.useMemo(() => {
    return reservations
      .filter((r) => {
        if (!r.reservation_date) return false;
        const resDate = parseISO(r.reservation_date);
        return isAfter(resDate, now) && ["pending", "confirmed"].includes(r.status);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.reservation_date);
        const dateB = parseISO(b.reservation_date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [reservations, now]);

  const past = React.useMemo(() => {
    return reservations
      .filter((r) => {
        if (!r.reservation_date) return false;
        const resDate = parseISO(r.reservation_date);
        return isBefore(resDate, now) || r.status === "completed";
      })
      .sort((a, b) => {
        const dateA = parseISO(a.reservation_date);
        const dateB = parseISO(b.reservation_date);
        return dateB.getTime() - dateA.getTime();
      });
  }, [reservations, now]);

  // Generate stamps from past reservations
  const stamps: Stamp[] = React.useMemo(() => {
    return past.map((r, index) => ({
      id: r.id,
      restaurant: r.restaurant?.name || "Unknown Restaurant",
      restaurantSlug: r.restaurant?.slug,
      city: r.restaurant?.address ? extractCity(r.restaurant.address) : "Unknown",
      date: format(parseISO(r.reservation_date), "MMM yyyy"),
      color: getStampColor(r.restaurant?.cuisine_types, index),
      cuisine: r.restaurant?.cuisine_types?.[0] || undefined,
    }));
  }, [past]);

  const stampCount = stamps.length;
  const rank = React.useMemo(() => {
    if (stampCount >= 20) return "Culinary Ambassador";
    if (stampCount >= 10) return "Global Gourmet";
    if (stampCount >= 5) return "Cultural Ambassador";
    if (stampCount >= 3) return "Adventurous Diner";
    return "Explorer";
  }, [stampCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-paper py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-64 rounded-[3rem] mb-10" />
          <Skeleton className="h-32 rounded-[2.5rem] mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[2.5rem]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-paper py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Failed to load your passport. Please refresh the page.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Passport Header */}
        <div className="bg-brand-dark rounded-[3rem] p-10 text-white mb-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rotate-12 translate-x-10 -translate-y-10">
            <Image
              src="/logo.png"
              alt="Sankofa"
              width={256}
              height={256}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="h-32 w-32 rounded-3xl border-4 border-brand-bronze overflow-hidden bg-white flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-brand-bronze/20 to-brand-ochre/20 flex items-center justify-center text-4xl">
                🦅
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Culinary Passport</h1>
              <p className="text-brand-ochre font-bold text-sm tracking-widest uppercase mb-2">
                Rank: {rank} • {stampCount} {stampCount === 1 ? "Stamp" : "Stamps"} Collected
              </p>
              {stampCount >= 5 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-brand-forest/20 text-brand-green rounded-full text-[10px] font-bold border border-brand-green/30">
                    ✨ CULTURAL AMBASSADOR
                  </span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold border border-white/20">
                    MEMBER SINCE 2025
                  </span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold border border-white/20">
                    VERIFIED DINER
                  </span>
                </div>
              )}
              <div className="mt-4">
                <InstagramStoryExport
                  user={{ name: profileData?.profile?.full_name || "Diner" }}
                  stamps={stamps}
                  rank={rank}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Visas (Reservations) */}
        {upcoming.length > 0 && (
          <>
            <h2 className="text-sm font-black text-brand-bronze uppercase tracking-[0.3em] mb-6 px-4">
              Active Visas (Upcoming)
            </h2>
            <div className="space-y-4 mb-12">
              {upcoming.slice(0, 5).map((reservation) => {
                const resDate = parseISO(reservation.reservation_date);
                const restaurant = reservation.restaurant;
                return (
                  <div
                    key={reservation.id}
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex gap-6 items-center">
                        <div className="h-16 w-16 bg-brand-paper rounded-2xl flex items-center justify-center text-2xl border border-brand-bronze/10">
                          🥘
                        </div>
                        <div>
                          <h4 className="font-black text-brand-dark uppercase">
                            {restaurant?.name || "Restaurant"}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {restaurant?.address ? extractCity(restaurant.address) : "Location"} •{" "}
                            {format(resDate, "EEEE, MMM d")} at{" "}
                            {reservation.reservation_time
                              ? format(parseISO(`2000-01-01T${reservation.reservation_time.slice(0, 5)}:00`), "h:mm a")
                              : ""}
                          </p>
                          {restaurant?.cuisine_types && restaurant.cuisine_types.length > 0 && (
                            <p className="text-xs text-brand-bronze font-bold mt-1">
                              {restaurant.cuisine_types.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {restaurant?.slug && (
                          <>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="text-xs font-bold"
                            >
                              <Link href={`/restaurants/${restaurant.slug}`}>View</Link>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              className="btn-bronze text-xs font-bold uppercase tracking-widest"
                            >
                              <Link href={`/restaurants/${restaurant.slug}`}>Get Directions</Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* The Stamp Gallery */}
        <h2 className="text-sm font-black text-brand-bronze uppercase tracking-[0.3em] mb-6 px-4">
          Journey Log (Past Stamps)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stamps.map((stamp) => {
            const StampContent = (
              <div className="aspect-square bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-xl hover:-translate-y-1 transition-all">
                {/* The "Postal Stamp" Circle */}
                <div
                  className={`h-24 w-24 rounded-full ${stamp.color} mb-4 flex flex-col items-center justify-center p-2 border-4 border-dashed border-white/40 ${
                    stamp.isEvent ? "animate-spin-slow" : "rotate-[-12deg] group-hover:rotate-0"
                  } transition-transform relative overflow-hidden`}
                >
                  {stamp.emoji && (
                    <span className="text-2xl mb-1">{stamp.emoji}</span>
                  )}
                  <p className="text-[10px] font-black text-white leading-none mb-1 uppercase tracking-tighter text-center px-1">
                    {stamp.restaurant.length > 12 ? stamp.restaurant.slice(0, 10) + "..." : stamp.restaurant}
                  </p>
                  <div className="h-[1px] w-12 bg-white/30 my-1"></div>
                  <p className="text-[8px] font-bold text-white uppercase">{stamp.city}</p>
                  <p className="text-[8px] font-bold text-white/70 mt-1">{stamp.date}</p>
                  {stamp.isEvent && (
                    <div className="absolute -top-1 -right-1 bg-brand-forest text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg">
                      ✨
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stamp.isEvent ? "Rare" : "Captured"}
                </p>
              </div>
            );

            if (stamp.restaurantSlug) {
              return (
                <Link key={stamp.id} href={`/restaurants/${stamp.restaurantSlug}`}>
                  {StampContent}
                </Link>
              );
            }

            return <div key={stamp.id}>{StampContent}</div>;
          })}

          {/* Empty Slot */}
          {stamps.length < 20 && (
            <div className="aspect-square rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6">
              <p className="text-2xl mb-2 opacity-30">🍴</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
                Book a meal to earn your next stamp
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
