import type { MetadataRoute } from "next";
import { buildFullSitemap } from "@/lib/sitemap-urls";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildFullSitemap();
}
