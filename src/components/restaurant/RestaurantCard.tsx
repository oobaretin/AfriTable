"use client";

import Link from "next/link";
import Image from "next/image";
import type { Database } from "@db/database.types";
import { useBookingDrawer } from "@/contexts/BookingDrawerContext";

export type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"] & {
  // optional denormalized fields for UI
  distance_miles?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
  vibe_tags?: string[] | null; // Vibe tags like "Fine Dining", "Casual", etc.
  region?: string | null; // Region field from JSON data (e.g., "West African", "East African")
};

export function RestaurantCard({
  restaurant,
  href,
  onQuickReserve,
  city,
  index = 0,
}: {
  restaurant: RestaurantRow;
  href?: string;
  onQuickReserve?: () => void;
  city?: string;
  index?: number;
}) {
  const { openDrawer } = useBookingDrawer();
  const safeHref = href ?? `/restaurants/${encodeURIComponent(restaurant.slug)}`;
  const cuisines = Array.isArray(restaurant.cuisine_types) ? restaurant.cuisine_types : [];
  const price = "$".repeat(Math.max(1, Math.min(4, restaurant.price_range ?? 1)));
  const imgSrc = restaurant.images?.[0] || "/og-image.svg";
  const cityFromAddress = (restaurant.address as any)?.city as string | undefined;
  const cityLabel = city ?? cityFromAddress;
  
  // Priority loading: first 6 images get priority, rest are lazy
  const shouldPriorityLoad = index < 6;
  
  // Generate a simple blur placeholder (base64 encoded 1x1 transparent pixel with blur)
  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";
  
  // Extract city from address if it's a string
  let displayCity = cityLabel;
  if (!displayCity && typeof restaurant.address === "string") {
    const parts = restaurant.address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      displayCity = parts[1];
    }
  }

  const handleFindTable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDrawer(restaurant);
  };
  
  // Get rating
  const rating = restaurant.avg_rating ?? null;
  
  // Get cuisine and region (if available)
  const cuisine = cuisines.length > 0 ? cuisines[0] : "";
  // Try to get region from restaurant.region field first, then from cuisine_types array
  const regionFromData = (restaurant as any).region as string | undefined;
  const regionFromCuisines = cuisines.length > 1 ? cuisines.slice(1).join(", ") : "";
  const region = regionFromData || regionFromCuisines;
  
  // Determine region color based on cuisine or region field
  const getRegionColor = (cuisineName: string, regionName?: string): { text: string; bg: string } => {
    const cuisineLower = cuisineName.toLowerCase();
    const regionLower = (regionName || "").toLowerCase();
    
    // West African cuisines - using Forest green from Sankofa wings
    if (
      cuisineLower.includes("nigerian") ||
      cuisineLower.includes("ghanaian") ||
      cuisineLower.includes("senegalese") ||
      cuisineLower.includes("ivorian") ||
      cuisineLower.includes("cameroonian") ||
      regionLower.includes("west african")
    ) {
      return { text: "text-brand-forest", bg: "bg-brand-forest/10" };
    }
    
    // East African cuisines - using Ochre gold from Sankofa tail
    if (
      cuisineLower.includes("ethiopian") ||
      cuisineLower.includes("eritrean") ||
      cuisineLower.includes("somali") ||
      cuisineLower.includes("kenyan") ||
      regionLower.includes("east african")
    ) {
      return { text: "text-brand-ochre", bg: "bg-brand-ochre/10" };
    }
    
    // South African - using Ochre gold
    if (cuisineLower.includes("south african")) {
      return { text: "text-brand-ochre", bg: "bg-brand-ochre/10" };
    }
    
    // Caribbean - using Forest green (legacy support)
    if (
      cuisineLower.includes("jamaican") ||
      cuisineLower.includes("haitian") ||
      cuisineLower.includes("trinidadian") ||
      regionLower.includes("caribbean")
    ) {
      return { text: "text-brand-forest", bg: "bg-brand-forest/10" };
    }
    
    // Default
    return { text: "text-slate-500", bg: "bg-slate-100" };
  };
  
  const regionColor = getRegionColor(cuisine, region);

  return (
    <div className="group cursor-pointer overflow-hidden rounded-xl bg-white transition-all hover:shadow-xl border border-slate-100">
      {/* Image Container */}
      <Link href={safeHref} className="block">
        <div className="relative w-full overflow-hidden aspect-[4/3] bg-white/5">
          <Image
            src={imgSrc}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={shouldPriorityLoad}
            loading={shouldPriorityLoad ? undefined : "lazy"}
            placeholder="blur"
            blurDataURL={blurDataURL}
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
              <div className="flex items-center gap-1 text-brand-gold">
                <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {cuisine && (
            <p className="mb-4 text-sm font-medium">
              <span className={`inline-block px-2.5 py-1 rounded-md ${regionColor.bg} ${regionColor.text} font-semibold`}>
                {cuisine}
              </span>
              {region && <span className="text-slate-500 ml-2">{region}</span>}
            </p>
          )}

          {/* Specialty Badge */}
          {((restaurant as any).specialty || ((restaurant as any).menu_highlights && (restaurant as any).menu_highlights.length > 0)) && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C69C2B]/10 border border-[#C69C2B]/30 text-xs font-bold text-[#C69C2B]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Must Try: {(restaurant as any).specialty || ((restaurant as any).menu_highlights && (restaurant as any).menu_highlights[0])}
              </span>
            </div>
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

          <div className="w-full rounded-lg bg-brand-mutedRed py-3 text-center text-sm font-bold text-white transition-colors hover:bg-brand-mutedRed/90 active:bg-brand-mutedRed/80">
            View Details →
          </div>
        </div>
      </Link>

      {/* Find Table Button */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={handleFindTable}
          className="w-full rounded-lg bg-[#A33B32] hover:bg-[#A33B32]/90 text-white px-3 py-2.5 text-sm font-bold transition-colors"
        >
          Find Table
        </button>
      </div>

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
