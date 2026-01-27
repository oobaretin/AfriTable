"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatTime12h } from "@/lib/utils/time-format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantOwnerDashboardLayout } from "./RestaurantOwnerDashboardLayout";

type Reservation = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  special_requests: string | null;
  occasion: string | null;
};

type ReservationsResp = {
  restaurantId: string;
  day: string;
  stats: { total: number; completed: number; noShows: number; upcoming: number; covers: number };
  reservations: Reservation[];
};

export function RestaurantOwnerDashboard({ restaurantName }: { restaurantName: string }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayFormatted = format(new Date(), "EEEE, MMM d, yyyy");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ReservationsResp>({
    queryKey: ["ownerReservations", today, "confirmed"],
    queryFn: async () => {
      const res = await fetch(
        `/api/dashboard/reservations?date=${encodeURIComponent(today)}&status=confirmed`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load reservations");
      return data as ReservationsResp;
    },
    refetchInterval: 30_000, // Refetch every 30 seconds
  });

  // Filter to today's confirmed reservations and get next 4
  const todayReservations = React.useMemo(() => {
    if (!data?.reservations) return [];
    return data.reservations
      .filter((r) => r.reservation_date === today && r.status === "confirmed")
      .sort((a, b) => {
        // Sort by time
        const timeA = a.reservation_time || "00:00";
        const timeB = b.reservation_time || "00:00";
        return timeA.localeCompare(timeB);
      })
      .slice(0, 4);
  }, [data, today]);

  // Calculate metrics
  const totalCovers = data?.stats.covers ?? 0;
  const activeTables = todayReservations.length;
  const totalToday = data?.stats.total ?? 0;
  
  // Calculate estimated revenue (rough estimate: $60 per cover)
  const estimatedRevenue = totalCovers * 60;

  async function markAsArrived(reservationId: string) {
    try {
      const res = await fetch(`/api/dashboard/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "seated" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Update failed");
      }
      toast.success("Reservation marked as arrived");
      // Refetch reservations
      await queryClient.invalidateQueries({ queryKey: ["ownerReservations"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update reservation");
    }
  }

  async function pauseBookings() {
    toast.info("Pause bookings feature coming soon");
    // TODO: Implement pause bookings functionality
  }

  return (
    <RestaurantOwnerDashboardLayout restaurantName={restaurantName} activeTab="overview">
      <div className="p-6 lg:p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">
              {restaurantName}
            </h1>
            <p className="text-sm text-brand-bronze font-bold">Today: {todayFormatted}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-400">Live Status</p>
              <p className="text-sm font-black text-brand-forest uppercase">Accepting Tables</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-white border-2 border-brand-forest shadow-sm flex items-center justify-center">
              🟢
            </div>
          </div>
        </header>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-3xl" />
            ))
          ) : (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Total Covers
                </p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-brand-dark">{totalCovers}</p>
                  <p className="text-xs font-bold text-brand-bronze">+12%</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Active Tables
                </p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-brand-dark">{activeTables}/12</p>
                  <p className="text-xs font-bold text-brand-forest">Busy</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  New Reviews
                </p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-brand-dark">5</p>
                  <p className="text-xs font-bold text-brand-ochre">★ 4.9</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Revenue (Est.)
                </p>
                <div className="flex justify-between items-end">
                  <p className="text-2xl font-black text-brand-dark">
                    ${(estimatedRevenue / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs font-bold text-brand-dark">+8%</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upcoming Bookings & Action List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-brand-dark uppercase text-sm tracking-widest">
                  Next 4 Reservations
                </h3>
                <Link
                  href="/dashboard"
                  className="text-xs font-bold text-brand-bronze hover:text-brand-bronze/80"
                >
                  View All
                </Link>
              </div>
              {isLoading ? (
                <div className="divide-y divide-slate-50">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-6">
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-6 text-center text-slate-500">
                  Failed to load reservations. Please refresh.
                </div>
              ) : todayReservations.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No confirmed reservations for today.
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {todayReservations.map((res) => (
                    <div
                      key={res.id}
                      className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="h-10 w-10 bg-brand-paper rounded-full flex items-center justify-center font-bold text-brand-bronze">
                          {res.party_size}
                        </div>
                        <div>
                          <p className="font-bold text-brand-dark">
                            {res.guest_name || "Guest"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {res.special_requests || res.occasion || "No special notes"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-brand-dark">
                          {formatTime12h(res.reservation_time)}
                        </p>
                        <button
                          onClick={() => markAsArrived(res.id)}
                          className="text-[10px] font-bold text-brand-forest uppercase tracking-tighter hover:text-brand-forest/80 transition-colors"
                        >
                          Arrived
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-brand-bronze rounded-[2rem] p-6 text-white shadow-xl shadow-brand-bronze/20">
              <h4 className="font-black uppercase tracking-widest text-xs mb-4">Quick Control</h4>
              <Button
                onClick={pauseBookings}
                variant="secondary"
                className="w-full bg-white text-brand-bronze py-3 rounded-xl font-bold text-sm mb-3 hover:bg-white/90"
              >
                Pause New Bookings
              </Button>
              <Button
                variant="outline"
                className="w-full bg-brand-dark/20 border border-white/20 py-3 rounded-xl font-bold text-sm text-white hover:bg-brand-dark/30"
              >
                Broadcast Special Menu
              </Button>
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <h4 className="font-black uppercase tracking-widest text-xs mb-4 text-slate-400">
                Owner Insight
              </h4>
              <p className="text-sm text-slate-600 italic">
                &quot;Tuesdays are usually slow. Consider activating a &apos;2-for-1 Appetizer&apos;
                promo to fill 5 more tables tonight.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </RestaurantOwnerDashboardLayout>
  );
}
