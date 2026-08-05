/** Shared photo ranking for catalog scripts (mirrors src/lib/restaurant-image.ts). */

const STREET_VIEW_RE =
  /streetviewpixels-pa\.googleapis\.com|maps\.googleapis\.com\/maps\/api\/streetview|googlestreetview/i;
const STOCK = "https://images.unsplash.com/";
const BRAND = ["/restaurant-card-placeholder.svg", "/og-image.svg"];

export function classifyPhotoUrl(url) {
  const t = String(url || "").trim();
  if (!t) return "empty";
  if (BRAND.some((b) => t.endsWith(b))) return "placeholder";
  if (t.startsWith(STOCK)) return "stock";
  if (STREET_VIEW_RE.test(t)) return "street_view";
  return "venue";
}

export function rankRestaurantImages(images) {
  const rank = { venue: 0, street_view: 1, stock: 2, placeholder: 3, empty: 4 };
  const seen = new Set();
  const scored = [];
  for (const raw of images ?? []) {
    const url = String(raw ?? "").trim();
    if (!url || seen.has(url)) continue;
    const q = classifyPhotoUrl(url);
    if (q === "empty" || q === "stock" || q === "placeholder") continue;
    seen.add(url);
    scored.push({ url, r: rank[q] });
  }
  scored.sort((a, b) => a.r - b.r);
  return scored.map((s) => s.url);
}

export function hasVenuePhoto(images) {
  return (images ?? []).some((u) => classifyPhotoUrl(u) === "venue");
}

export function photoOnlyStreetView(images) {
  const qs = (images ?? []).map(classifyPhotoUrl).filter((q) => !["empty", "placeholder", "stock"].includes(q));
  return qs.length > 0 && qs.every((q) => q === "street_view");
}
