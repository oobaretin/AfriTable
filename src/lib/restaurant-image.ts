/**
 * Restaurant card/detail imagery. Catalog entries without real photos use the
 * AfriTable branded placeholder (4:3) — not generic stock photos.
 */

/** Card-sized AfriTable brand art (matches og-image palette, correct aspect ratio). */
export const RESTAURANT_BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg";

/** Legacy wide OG asset — still accepted if present in data. */
export const RESTAURANT_LEGACY_PLACEHOLDER = "/og-image.svg";

const STOCK_UNSPLASH_PREFIX = "https://images.unsplash.com/";

function isStockPlaceholder(url: string): boolean {
  return url.startsWith(STOCK_UNSPLASH_PREFIX);
}

function normalizeImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (isStockPlaceholder(trimmed)) return null;
  return trimmed;
}

type RestaurantImageInput = {
  images?: string[] | null;
  region?: string | null;
  cuisine_types?: string[] | null;
  cuisine?: string | null;
};

/** First real image URL, or the AfriTable branded placeholder. */
export function resolveRestaurantImageUrl(restaurant: RestaurantImageInput): string {
  for (const raw of restaurant.images ?? []) {
    const url = normalizeImageUrl(String(raw ?? ""));
    if (url) return url;
  }
  return RESTAURANT_BRAND_PLACEHOLDER;
}
