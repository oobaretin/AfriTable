"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { BookingCheckout } from "./BookingCheckout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  city?: string;
  images?: string[];
  address?: unknown;
};

export function BookingCheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const restaurantSlug = searchParams.get("restaurant");
  const dateStr = searchParams.get("date");
  const timeStr = searchParams.get("time");
  const partySizeStr = searchParams.get("party");

  // Fetch restaurant details (must be called before any early returns)
  const { data: restaurant, isLoading } = useQuery<Restaurant | null>({
    queryKey: ["restaurant", restaurantSlug],
    queryFn: async () => {
      if (!restaurantSlug) return null;
      const supabase = createSupabasePublicClient();
      const { data, error } = await supabase
        .from("restaurants_with_rating")
        .select("id, name, slug, images, address")
        .eq("slug", restaurantSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return null;
      return data as Restaurant;
    },
    enabled: !!restaurantSlug,
  });

  // Validate required params
  if (!restaurantSlug || !dateStr || !timeStr || !partySizeStr) {
    router.push("/restaurants");
    return null;
  }

  const date = parseISO(dateStr);
  const time = timeStr;
  const partySize = parseInt(partySizeStr, 10) || 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-paper py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-[2.5rem]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-brand-paper py-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-brand-dark mb-4">Restaurant not found</h1>
          <p className="text-slate-600 mb-6">The restaurant you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
          <button
            onClick={() => router.push("/restaurants")}
            className="btn-bronze px-6 py-3 rounded-xl text-white font-bold uppercase"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <BookingCheckout
      restaurant={restaurant}
      bookingDetails={{
        restaurantSlug: restaurant.slug,
        restaurantId: restaurant.id,
        date,
        time,
        partySize,
      }}
    />
  );
}
