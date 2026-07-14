/**
 * Restaurant card/detail imagery. Catalog entries without real photos use the
 * AfriTable branded placeholder (4:3) until venue photos are added.
 */

/** Card-sized AfriTable brand art (matches og-image palette, correct aspect ratio). */
export const RESTAURANT_BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg";

/** Legacy wide OG asset — still accepted if present in data. */
export const RESTAURANT_LEGACY_PLACEHOLDER = "/og-image.svg";

const BRAND_PATHS = new Set([RESTAURANT_BRAND_PLACEHOLDER, RESTAURANT_LEGACY_PLACEHOLDER]);

const STOCK_UNSPLASH_PREFIX = "https://images.unsplash.com/";

/** Local SVG placeholders must bypass `next/image` optimization (optimizer returns null/400). */
export function isAfriTableBrandImage(src: string): boolean {
  const s = src.trim();
  if (BRAND_PATHS.has(s)) return true;
  return s.endsWith("/restaurant-card-placeholder.svg") || s.endsWith("/og-image.svg");
}

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

/** First real photo for Open Graph / Twitter cards, or null to fall back to site default. */
export function resolveRestaurantOgImageUrl(restaurant: RestaurantImageInput): string | null {
  const url = resolveRestaurantImageUrl(restaurant);
  if (isAfriTableBrandImage(url)) return null;
  return url;
}
