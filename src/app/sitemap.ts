import type { MetadataRoute } from "next";
import { buildFullSitemap } from "@/lib/sitemap-urls";

/** Always read live Supabase + catalog; avoid stale Vercel edge cache after bulk imports. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildFullSitemap();
}
