/**
 * Restaurant card/detail imagery. Catalog entries without real photos use the
 * AfriTable branded placeholder (4:3) until venue photos are added.
 * Heroes prefer venue photos over Street View.
 */

/** Card-sized AfriTable brand art (matches og-image palette, correct aspect ratio). */
export const RESTAURANT_BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg";

/** Legacy wide OG asset — still accepted if present in data. */
export const RESTAURANT_LEGACY_PLACEHOLDER = "/og-image.svg";

const BRAND_PATHS = new Set([RESTAURANT_BRAND_PLACEHOLDER, RESTAURANT_LEGACY_PLACEHOLDER]);

const STOCK_UNSPLASH_PREFIX = "https://images.unsplash.com/";

const STREET_VIEW_RE =
  /streetviewpixels-pa\.googleapis\.com|maps\.googleapis\.com\/maps\/api\/streetview|googlestreetview/i;

export type PhotoQuality = "venue" | "street_view" | "placeholder" | "stock" | "empty";

/** Local SVG placeholders must bypass `next/image` optimization (optimizer returns null/400). */
export function isAfriTableBrandImage(src: string): boolean {
  const s = src.trim();
  if (BRAND_PATHS.has(s)) return true;
  return s.endsWith("/restaurant-card-placeholder.svg") || s.endsWith("/og-image.svg");
}

export function isStreetViewImage(url: string): boolean {
  return STREET_VIEW_RE.test(url.trim());
}

export function classifyPhotoUrl(url: string | null | undefined): PhotoQuality {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "empty";
  if (isAfriTableBrandImage(trimmed) || trimmed === RESTAURANT_BRAND_PLACEHOLDER) return "placeholder";
  if (trimmed.startsWith(STOCK_UNSPLASH_PREFIX)) return "stock";
  if (isStreetViewImage(trimmed)) return "street_view";
  return "venue";
}

function photoRank(quality: PhotoQuality): number {
  switch (quality) {
    case "venue":
      return 0;
    case "street_view":
      return 1;
    case "stock":
      return 2;
    case "placeholder":
      return 3;
    default:
      return 4;
  }
}

/**
 * Order images for gallery/hero: venue photos first, Street View last.
 * Drops empty/stock/brand placeholders when venue or street photos exist.
 */
export function rankRestaurantImages(images: string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const scored: { url: string; rank: number }[] = [];

  for (const raw of images ?? []) {
    const url = String(raw ?? "").trim();
    if (!url || seen.has(url)) continue;
    const quality = classifyPhotoUrl(url);
    if (quality === "empty" || quality === "stock" || quality === "placeholder") continue;
    seen.add(url);
    scored.push({ url, rank: photoRank(quality) });
  }

  scored.sort((a, b) => a.rank - b.rank);
  return scored.map((s) => s.url);
}

export function hasVenuePhoto(images: string[] | null | undefined): boolean {
  return (images ?? []).some((u) => classifyPhotoUrl(u) === "venue");
}

export function photoOnlyStreetView(images: string[] | null | undefined): boolean {
  const list = (images ?? [])
    .map((u) => classifyPhotoUrl(u))
    .filter((q) => q !== "empty" && q !== "placeholder" && q !== "stock");
  if (!list.length) return false;
  return list.every((q) => q === "street_view");
}

function normalizeImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith(STOCK_UNSPLASH_PREFIX)) return null;
  if (isAfriTableBrandImage(trimmed)) return null;
  return trimmed;
}

type RestaurantImageInput = {
  images?: string[] | null;
  region?: string | null;
  cuisine_types?: string[] | null;
  cuisine?: string | null;
};

/**
 * Best cover image for cards/heroes: ranked venue photo first, then Street View,
 * else AfriTable branded placeholder.
 */
export function resolveRestaurantImageUrl(restaurant: RestaurantImageInput): string {
  const ranked = rankRestaurantImages(restaurant.images);
  if (ranked.length) return ranked[0];

  for (const raw of restaurant.images ?? []) {
    const url = normalizeImageUrl(String(raw ?? ""));
    if (url) return url;
  }
  return RESTAURANT_BRAND_PLACEHOLDER;
}

/** Ordered gallery URLs for ImmersiveGallery (venue before Street View). */
export function resolveRestaurantGalleryImages(restaurant: RestaurantImageInput): string[] {
  const ranked = rankRestaurantImages(restaurant.images);
  if (ranked.length) return ranked;

  const fallback: string[] = [];
  for (const raw of restaurant.images ?? []) {
    const url = normalizeImageUrl(String(raw ?? ""));
    if (url) fallback.push(url);
  }
  return fallback;
}

/** First real venue photo for Open Graph — skip Street View when possible. */
export function resolveRestaurantOgImageUrl(restaurant: RestaurantImageInput): string | null {
  const ranked = rankRestaurantImages(restaurant.images);
  const venue = ranked.find((u) => classifyPhotoUrl(u) === "venue");
  if (venue) return venue;
  const url = resolveRestaurantImageUrl(restaurant);
  if (isAfriTableBrandImage(url)) return null;
  if (classifyPhotoUrl(url) === "street_view") return null;
  return url;
}
