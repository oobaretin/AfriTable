"use client";

import Link from "next/link";
import Image from "next/image";
import type { Database } from "@db/database.types";

export type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"] & {
  // optional denormalized fields for UI
  distance_miles?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
  vibe_tags?: string[] | null; // Vibe tags like "Fine Dining", "Casual", etc.
};

export function RestaurantCard({
  restaurant,
  href,
  onQuickReserve,
  city,
}: {
  restaurant: RestaurantRow;
  href?: string;
  onQuickReserve?: () => void;
  city?: string;
}) {
  const safeHref = href ?? `/restaurants/${encodeURIComponent(restaurant.slug)}`;
  const cuisines = Array.isArray(restaurant.cuisine_types) ? restaurant.cuisine_types : [];
  const price = "$".repeat(Math.max(1, Math.min(4, restaurant.price_range ?? 1)));
  const imgSrc = restaurant.images?.[0] || "/og-image.svg";
  const cityFromAddress = (restaurant.address as any)?.city as string | undefined;
  const cityLabel = city ?? cityFromAddress;
  
  // Extract city from address if it's a string
  let displayCity = cityLabel;
  if (!displayCity && typeof restaurant.address === "string") {
    const parts = restaurant.address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      displayCity = parts[1];
    }
  }
  
  // Get rating
  const rating = restaurant.avg_rating ?? null;
  
  // Get cuisine and region (if available)
  const cuisine = cuisines.length > 0 ? cuisines[0] : "";
  const region = cuisines.length > 1 ? cuisines.slice(1).join(", ") : "";

  return (
    <div className="group cursor-pointer overflow-hidden rounded-xl bg-white transition-all hover:shadow-xl border border-slate-100">
      {/* Image Container */}
      <Link href={safeHref} className="block">
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={imgSrc}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur-sm">
              {price}
            </div>
            {restaurant.vibe_tags && restaurant.vibe_tags.length > 0 && (
              <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur-sm">
                {restaurant.vibe_tags[0]}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 truncate uppercase tracking-tight">
              {restaurant.name}
            </h3>
            {rating !== null && (
              <div className="flex items-center gap-1 text-amber-500">
                <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {cuisine && (
            <p className="mb-4 text-sm font-medium text-slate-500">
              {cuisine}
              {region && ` • ${region}`}
            </p>
          )}

          {displayCity && (
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {displayCity}
            </div>
          )}

          <div className="w-full rounded-lg bg-orange-600 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-orange-700 active:bg-orange-800">
            View Details →
          </div>
        </div>
      </Link>

      {onQuickReserve && (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onQuickReserve}
            className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Quick Reserve
          </button>
        </div>
      )}
    </div>
  );
}
