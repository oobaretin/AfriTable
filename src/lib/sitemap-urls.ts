import "server-only";

import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { loadRestaurantsFromJSON } from "@/lib/restaurant-json-loader-server";

export function getSitemapBaseUrl(): string {
  return getAppBaseUrl();
}

/** URL slug for `/city/[city]` — must match titleCaseFromSlug inverse used on city pages. */
export function citySlugFromDisplayName(displayCity: string): string {
  return displayCity.trim().toLowerCase().replace(/\s+/g, "-");
}

function restaurantPathSegment(slugOrId: string): string {
  return `/restaurants/${encodeURIComponent(slugOrId)}`;
}

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  baseUrl: string,
  path: string,
  opts: { changeFrequency: SitemapEntry["changeFrequency"]; priority: number; lastModified?: Date }
): SitemapEntry {
  return {
    url: `${baseUrl}${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
  };
}

/** Marketing / legal pages that should be indexed. */
export function getStaticSitemapEntries(baseUrl: string): SitemapEntry[] {
  const pages: Array<{ path: string; changeFrequency: SitemapEntry["changeFrequency"]; priority: number }> = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/restaurants", changeFrequency: "daily", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: "/join-as-restaurant", changeFrequency: "monthly", priority: 0.6 },
    { path: "/submit-restaurant", changeFrequency: "monthly", priority: 0.5 },
    { path: "/claim", changeFrequency: "monthly", priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
    { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
  ];
  return pages.map((p) => entry(baseUrl, p.path, p));
}

export async function getRestaurantSitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const supabase = createSupabasePublicClient();
  const { data: dbRows } = await supabase
    .from("restaurants")
    .select("slug, id, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  const seen = new Set<string>();
  const out: SitemapEntry[] = [];

  const add = (segment: string, lastModified?: Date) => {
    const path = restaurantPathSegment(segment);
    if (seen.has(path)) return;
    seen.add(path);
    out.push(
      entry(baseUrl, path, {
        changeFrequency: "weekly",
        priority: 0.8,
        lastModified: lastModified ?? new Date(),
      })
    );
  };

  for (const row of dbRows ?? []) {
    const segment = String(row.slug || row.id || "").trim();
    if (!segment) continue;
    add(segment, row.created_at ? new Date(row.created_at) : undefined);
  }

  for (const r of loadRestaurantsFromJSON()) {
    const segment = String(r.id || "").trim();
    if (!segment) continue;
    add(segment);
  }

  return out;
}

/** City landing pages backed by Supabase `display_city` (pages 404 if no rows). */
export async function getCitySitemapEntries(baseUrl: string): Promise<SitemapEntry[]> {
  const supabase = createSupabasePublicClient();
  const { data } = await supabase
    .from("restaurants")
    .select("display_city")
    .eq("is_active", true)
    .not("display_city", "is", null);

  const slugs = new Set<string>();
  for (const row of data ?? []) {
    const city = String(row.display_city ?? "").trim();
    if (!city) continue;
    slugs.add(citySlugFromDisplayName(city));
  }

  return Array.from(slugs)
    .sort()
    .map((slug) =>
      entry(baseUrl, `/city/${encodeURIComponent(slug)}`, {
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );
}

export async function buildFullSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSitemapBaseUrl();
  const [restaurants, cities] = await Promise.all([
    getRestaurantSitemapEntries(baseUrl),
    getCitySitemapEntries(baseUrl),
  ]);
  return [...getStaticSitemapEntries(baseUrl), ...cities, ...restaurants];
}
