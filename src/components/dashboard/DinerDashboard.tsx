"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { formatTime12h } from "@/lib/utils/time-format";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
// Note: loadRestaurantsFromJSON is server-side only, so we'll fetch favorites from API

type ReservationRow = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  special_requests: string | null;
  occasion: string | null;
  created_at: string;
  updated_at: string;
  restaurant: {
    id: string;
    slug: string;
    name: string;
    address: any;
    phone: string | null;
    images: string[];
    cuisine_types: string[];
  } | null;
};

type FavoriteRow = {
  restaurant_id: string;
  created_at: string;
  restaurant: {
    id: string;
    slug: string;
    name: string;
    cuisine_types: string[];
    address: any;
    images: string[];
  } | null;
};

type ApiReservationsResp = { reservations: ReservationRow[] };
type ApiFavoritesResp = { favorites: FavoriteRow[] };

function reservationStart(r: ReservationRow) {
  return new Date(`${r.reservation_date}T${String(r.reservation_time).slice(0, 5)}:00`);
}

function addressToString(address: any) {
  if (!address) return "";
  if (typeof address === "string") return address;
  const a: any = address ?? {};
  return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
}

function extractCity(address: any): string {
  if (!address) return "";
  if (typeof address === "string") {
    const parts = address.split(",").map((s: string) => s.trim());
    return parts.length >= 2 ? parts[1] : "";
  }
  return address.city || "";
}

export function DinerDashboard() {
  const now = new Date();

  // Fetch reservations
  const reservationsQuery = useQuery<ApiReservationsResp>({
    queryKey: ["myReservations"],
    queryFn: async () => {
      const res = await fetch("/api/user/reservations");
      const data = (await res.json()) as ApiReservationsResp;
      if (!res.ok) throw new Error((data as any)?.message || "Failed to load reservations");
      return data;
    },
  });

  // Fetch favorites
  const favoritesQuery = useQuery<ApiFavoritesResp>({
    queryKey: ["myFavorites"],
    queryFn: async () => {
      const res = await fetch("/api/user/favorites");
      const data = (await res.json()) as ApiFavoritesResp;
      if (!res.ok) throw new Error((data as any)?.message || "Failed to load favorites");
      return data;
    },
  });

  const allReservations = reservationsQuery.data?.reservations ?? [];
  const favorites = favoritesQuery.data?.favorites ?? [];

  // Separate upcoming and past reservations
  const upcoming = allReservations
    .filter((r) => ["pending", "confirmed", "seated"].includes(r.status) && isAfter(reservationStart(r), now))
    .sort((a, b) => reservationStart(a).getTime() - reservationStart(b).getTime());

  const past = allReservations
    .filter((r) => ["completed", "no_show"].includes(r.status) || isBefore(reservationStart(r), now))
    .sort((a, b) => reservationStart(b).getTime() - reservationStart(a).getTime())
    .slice(0, 10); // Limit to 10 most recent

  // Calculate stats
  const stamps = past.filter((r) => r.status === "completed").length;
  const uniqueCuisines = new Set<string>();
  past.forEach((r) => {
    if (r.restaurant?.cuisine_types) {
      r.restaurant.cuisine_types.forEach((c: string) => uniqueCuisines.add(c));
    }
  });
  const cuisinesCount = uniqueCuisines.size;

  // Calculate loyalty progress (70% for demo, can be calculated based on visits)
  const loyaltyProgress = Math.min(70, (stamps / 10) * 100);
  const visitsUntilGold = Math.max(0, 10 - stamps);


  // Get user name from profile
  const profileQuery = useQuery<{ profile: { full_name?: string } | null }>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load profile");
      return data;
    },
  });

  const userName = profileQuery.data?.profile?.full_name || "Diner";

  if (reservationsQuery.isLoading || favoritesQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <p className="text-slate-500">Loading your passport...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header with "Passport" Stats */}
      <div className="bg-brand-dark rounded-[2rem] p-8 mb-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">🥘</div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Diner Passport</h1>
            <p className="text-slate-400 font-medium italic">Welcome back, {userName}. Your table is ready.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <div className="text-2xl font-black text-brand-ochre">{stamps}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Stamps</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <div className="text-2xl font-black text-brand-mutedRed">{cuisinesCount}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Cuisines</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Upcoming & Past Reservations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Reservations */}
          <section>
            <h2 className="text-xl font-black text-brand-dark mb-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-forest animate-pulse"></span>
              Upcoming Reservations
            </h2>
            {upcoming.length > 0 ? (
              <div className="space-y-4">
                {upcoming.map((r) => {
                  const restaurant = r.restaurant;
                  const city = restaurant ? extractCity(restaurant.address) : "";
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-lg">{restaurant?.name || "Restaurant"}</h3>
                          <p className="text-sm text-slate-500">
                            {format(parseISO(r.reservation_date), "MMM d, yyyy")} • {formatTime12h(r.reservation_time)}
                          </p>
                          <p className="text-xs text-brand-bronze font-bold mt-1 uppercase tracking-tighter">
                            Table for {r.party_size} {city ? `• ${city}` : ""}
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/restaurants/${restaurant?.slug || ""}`}>Modify</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <p className="text-slate-500">No upcoming reservations</p>
                <Button asChild className="mt-4">
                  <Link href="/restaurants">Browse Restaurants</Link>
                </Button>
              </div>
            )}
          </section>

          {/* Past Stamps (History) */}
          <section>
            <h2 className="text-xl font-black text-brand-dark mb-6">Past Stamps (History)</h2>
            {past.length > 0 ? (
              <div className="space-y-4">
                {past.map((r) => {
                  const restaurant = r.restaurant;
                  const visitDate = format(parseISO(r.reservation_date), "MMM yyyy");
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-lg border border-slate-100 shadow-sm">
                        ✅
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{restaurant?.name || "Restaurant"}</h4>
                        <p className="text-xs text-slate-500 italic">Successfully visited in {visitDate}</p>
                      </div>
                      <div className="flex gap-2">
                        {restaurant && (
                          <PhotoUploadDialog
                            reservationId={r.id}
                            restaurantName={restaurant.name}
                            restaurantSlug={restaurant.slug}
                            onUploadComplete={() => {
                              // Refresh data if needed
                              reservationsQuery.refetch();
                            }}
                          />
                        )}
                        <Button asChild variant="ghost" size="sm" className="text-xs font-black text-brand-bronze uppercase">
                          <Link href={`/reviews/new/${r.id}`}>Rate</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50/50 rounded-xl p-8 text-center border border-slate-100">
                <p className="text-slate-500 italic">Start your culinary journey to collect stamps!</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Favorites & Perks */}
        <div className="space-y-8">
          {/* Saved Flavors */}
          <section className="bg-brand-paper rounded-3xl p-6 border border-brand-bronze/10">
            <h2 className="text-lg font-black text-brand-dark mb-4">Saved Flavors</h2>
            {favorites.length > 0 ? (
              <div className="space-y-3">
                {favorites.slice(0, 5).map((fav) => {
                  const restaurant = fav.restaurant;
                  const cuisine = restaurant?.cuisine_types?.[0] || "";
                  const city = restaurant ? extractCity(restaurant.address) : "";
                  const imageSrc = restaurant?.images?.[0] || "/og-image.svg";
                  
                  return (
                    <Link
                      key={fav.restaurant_id}
                      href={`/restaurants/${restaurant?.slug || fav.restaurant_id}`}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                        <Image
                          src={imageSrc}
                          alt={restaurant?.name || ""}
                          width={48}
                          height={48}
                          className="object-cover h-full w-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-brand-mutedRed transition-colors truncate">
                          {restaurant?.name || "Restaurant"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                          {city} {cuisine ? `• ${cuisine}` : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-4">No saved restaurants yet</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/restaurants">Explore Restaurants</Link>
                </Button>
              </div>
            )}
          </section>

          {/* AfriTable Gold */}
          <section className="bg-gradient-to-br from-brand-bronze to-[#5a3f24] rounded-3xl p-6 text-white">
            <h2 className="text-lg font-black mb-2 tracking-tight">AfriTable Gold</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              You are {visitsUntilGold} {visitsUntilGold === 1 ? "visit" : "visits"} away from unlocking 0% booking fees and priority holiday seating.
            </p>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-ochre h-full transition-all duration-500" style={{ width: `${loyaltyProgress}%` }}></div>
            </div>
            <p className="text-xs text-slate-300 mt-2 text-right">{Math.round(loyaltyProgress)}% Complete</p>
          </section>
        </div>
      </div>
    </div>
  );
}
