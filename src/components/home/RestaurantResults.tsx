"use client";

import * as React from "react";
import Link from "next/link";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { transformJSONRestaurantToDetail } from "@/lib/restaurant-json-loader";
import { useLivePartnerSlugs, isLivePartnerSlug } from "@/contexts/live-partner-slugs-context";
import { resolveBookingAction } from "@/lib/booking-action";
import type { CatalogListItem } from "@/lib/catalog-list-item";

type RestaurantWithDistance = {
  restaurant: CatalogListItem;
  distance: number | null;
};

type RestaurantResultsProps = {
  restaurants: RestaurantWithDistance[];
};

export function RestaurantResults({ restaurants }: RestaurantResultsProps) {
  const livePartnerSlugs = useLivePartnerSlugs();
  const isSearchMode = restaurants.length > 0 && restaurants[0].distance !== null;

  const displayedRestaurants = React.useMemo(() => {
    if (isSearchMode) {
      return restaurants;
    }

    const FULL_DATASET_SIZE = 50;
    if (restaurants.length < FULL_DATASET_SIZE && restaurants.length > 0) {
      return restaurants;
    }

    const featured = restaurants.filter((r) => r.restaurant.price_range === "$$$");
    return featured.slice(0, 4);
  }, [restaurants, isSearchMode]);

  if (displayedRestaurants.length === 0) {
    return (
      <section className="pt-24 pb-0 bg-[#000814] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h2 className="text-2xl md:text-3xl font-serif text-[#C69C2B] font-normal mb-4">
              {isSearchMode ? "No Spots Found" : "Coming Soon to Your Area"}
            </h2>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {isSearchMode
                ? "Expanding our reach soon! No spots found within this distance."
                : "We're working on expanding our network of authentic African and Caribbean restaurants. Join our waitlist to be notified when we add restaurants near you."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-12 pb-24 bg-[#000814] px-6">
      <div className="max-w-7xl mx-auto">
        {isSearchMode ? (
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-serif text-[#C69C2B] font-normal mb-2">
              Restaurants Near You
            </h2>
            <p className="text-sm text-white/60">
              {displayedRestaurants.length}{" "}
              {displayedRestaurants.length === 1 ? "restaurant" : "restaurants"} found
            </p>
          </div>
        ) : (
          <div className="mb-16 border-l-4 border-[#A33B32] pl-8">
            <h2 className="text-[10px] font-black text-[#C69C2B] uppercase tracking-[0.5em] mb-2">
              Nationwide spotlight
            </h2>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">
              Across the country
            </h3>
            <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
              A rotating slice of highly rated spots from different states—explore every city on AfriTable.
            </p>
          </div>
        )}

        <div
          className={`grid gap-6 ${
            isSearchMode || displayedRestaurants.length > 4
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          {displayedRestaurants.map((item, index) => {
            const restaurant = {
              ...transformJSONRestaurantToDetail(item.restaurant),
              distance_miles: item.distance,
            };
            const slug = restaurant.slug || restaurant.id;
            return (
              <RestaurantCard
                key={item.restaurant.id}
                restaurant={restaurant}
                href={`/restaurants/${encodeURIComponent(slug)}`}
                index={index}
                isFeatured={Boolean(item.restaurant.featured)}
                bookingAction={resolveBookingAction(
                  isLivePartnerSlug(slug, livePartnerSlugs)
                    ? {
                        isLivePartner: true,
                        isClaimed: true,
                        onlineReservationsEnabled: true,
                      }
                    : { isLivePartner: false, isClaimed: false, onlineReservationsEnabled: false },
                  { phone: item.restaurant.phone },
                )}
              />
            );
          })}
        </div>

        {!isSearchMode && (
          <div className="mt-16 flex justify-center">
            <Link
              href="/restaurants"
              className="group relative bg-transparent hover:bg-[#C69C2B]/10 border border-[#C69C2B] text-[#C69C2B] text-[10px] font-black px-8 py-4 rounded-full uppercase tracking-widest transition-all duration-500 flex items-center gap-3 hover:shadow-[0_0_15px_rgba(198,156,43,0.4)] cursor-pointer inline-block"
              prefetch={false}
            >
              <span>See All Destinations</span>
              <span className="text-lg transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
