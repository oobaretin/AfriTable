"use client";

import Link from "next/link";
import Image from "next/image";
import type { Database } from "@db/database.types";

export type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"] & {
  // optional denormalized fields for UI
  distance_miles?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
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

  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md">
      <Link href={safeHref} className="block">
        <div className="relative h-48 w-full bg-muted">
          <Image
            src={imgSrc}
            alt={restaurant.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <div className="p-4">
          <h2 className="text-lg font-semibold">{restaurant.name}</h2>

          <p className="mb-1 mt-1 text-sm text-muted-foreground">
            {cuisines.length ? cuisines.join(" • ") : cityLabel ?? "—"}
          </p>

          {restaurant.description ? (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{restaurant.description}</p>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-sm">{price}</span>
            <span className="text-primary font-medium">View →</span>
          </div>
        </div>
      </Link>

      {onQuickReserve ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onQuickReserve}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Quick Reserve
          </button>
        </div>
      ) : null}
    </div>
  );
}

