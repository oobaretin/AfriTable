import "server-only";

import { loadRestaurantsFromJSON, type JSONRestaurant } from "@/lib/restaurant-json-loader-server";
import { RESTAURANT_BRAND_PLACEHOLDER } from "@/lib/restaurant-image";
import { extractCityFromAddress } from "@/lib/restaurant-list-filters";

type CatalogRestaurant = JSONRestaurant & { google_place_id?: string; state?: string };

export type CatalogQaIssue =
  | "placeholder_image"
  | "missing_website"
  | "templated_about"
  | "missing_place_id";

export type CatalogQaRow = {
  id: string;
  name: string;
  city: string;
  issues: CatalogQaIssue[];
};

const TEMPLATED_ABOUT_RE =
  /^Authentic .+ restaurant in .+\. Experience traditional .+ flavors and hospitality at/i;

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

function issuesForRestaurant(r: CatalogRestaurant): CatalogQaIssue[] {
  const issues: CatalogQaIssue[] = [];
  if (!hasRealImage(r.images)) issues.push("placeholder_image");
  if (!String(r.website || "").trim()) issues.push("missing_website");
  if (TEMPLATED_ABOUT_RE.test(String(r.about || "").trim())) issues.push("templated_about");
  if (!String(r.google_place_id || "").trim()) issues.push("missing_place_id");
  return issues;
}

export function getCatalogQaReport() {
  const catalog = loadRestaurantsFromJSON();
  const issueCounts: Record<CatalogQaIssue, number> = {
    placeholder_image: 0,
    missing_website: 0,
    templated_about: 0,
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
  missing_website: "No website",
  templated_about: "Templated copy",
  missing_place_id: "No Google place ID",
};
