import "server-only";

import { loadRestaurantsFromJSON, type JSONRestaurant } from "@/lib/restaurant-json-loader-server";
import { hasVenuePhoto, photoOnlyStreetView, RESTAURANT_BRAND_PLACEHOLDER } from "@/lib/restaurant-image";
import { isWeakAbout, isWeakSpecialty } from "@/lib/catalog-trust";
import { extractCityFromAddress } from "@/lib/restaurant-list-filters";

type CatalogRestaurant = JSONRestaurant & {
  google_place_id?: string;
  state?: string;
  specialty?: string;
};

export type CatalogQaIssue =
  | "placeholder_image"
  | "street_view_only"
  | "missing_website"
  | "templated_about"
  | "weak_specialty"
  | "missing_phone"
  | "missing_hours"
  | "missing_place_id";

export type CatalogQaRow = {
  id: string;
  name: string;
  city: string;
  issues: CatalogQaIssue[];
};

function hasRealImage(images: string[] | undefined): boolean {
  if (!images?.length) return false;
  return images.some((raw) => {
    const url = String(raw || "").trim();
    if (!url || url === RESTAURANT_BRAND_PLACEHOLDER) return false;
    if (url.endsWith("/restaurant-card-placeholder.svg") || url.endsWith("/og-image.svg")) return false;
    if (url.startsWith("https://images.unsplash.com/")) return false;
    return true;
  });
}

function hasHours(hours: unknown): boolean {
  if (!hours) return false;
  if (Array.isArray(hours)) return hours.length > 0;
  if (typeof hours === "object") return Object.keys(hours as object).length > 0;
  return typeof hours === "string" && hours.trim().length > 0;
}

function issuesForRestaurant(r: CatalogRestaurant): CatalogQaIssue[] {
  const issues: CatalogQaIssue[] = [];
  if (!hasRealImage(r.images)) issues.push("placeholder_image");
  else if (photoOnlyStreetView(r.images) || !hasVenuePhoto(r.images)) {
    if (photoOnlyStreetView(r.images)) issues.push("street_view_only");
  }
  if (!String(r.website || "").trim()) issues.push("missing_website");
  if (isWeakAbout(r.about)) issues.push("templated_about");
  const specialty = r.specialty || r.menu_highlights?.[0];
  if (isWeakSpecialty(specialty)) issues.push("weak_specialty");
  if (!String(r.phone || "").trim()) issues.push("missing_phone");
  if (!hasHours(r.hours)) issues.push("missing_hours");
  if (!String(r.google_place_id || "").trim()) issues.push("missing_place_id");
  return issues;
}

export function getCatalogQaReport() {
  const catalog = loadRestaurantsFromJSON();
  const issueCounts: Record<CatalogQaIssue, number> = {
    placeholder_image: 0,
    street_view_only: 0,
    missing_website: 0,
    templated_about: 0,
    weak_specialty: 0,
    missing_phone: 0,
    missing_hours: 0,
    missing_place_id: 0,
  };

  const rows: CatalogQaRow[] = [];

  for (const raw of catalog) {
    const r = raw as CatalogRestaurant;
    const issues = issuesForRestaurant(r);
    if (!issues.length) continue;
    for (const issue of issues) issueCounts[issue] += 1;
    rows.push({
      id: r.id,
      name: r.name,
      city: extractCityFromAddress(r.address) || r.state || "—",
      issues,
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));

  return {
    total: catalog.length,
    clean: catalog.length - rows.length,
    needsAttention: rows.length,
    issueCounts,
    rows,
  };
}

export const CATALOG_QA_LABELS: Record<CatalogQaIssue, string> = {
  placeholder_image: "Placeholder image",
  street_view_only: "Street View only",
  missing_website: "No website",
  templated_about: "Templated / weak copy",
  weak_specialty: "Weak specialty",
  missing_phone: "No phone",
  missing_hours: "No hours",
  missing_place_id: "No Google place ID",
};
