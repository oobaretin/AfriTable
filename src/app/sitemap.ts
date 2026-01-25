import type { MetadataRoute } from "next";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = createSupabasePublicClient();

  const { data } = await supabase
    .from("restaurants")
    .select("slug,updated_at:created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  const restaurantUrls =
    (data ?? []).map((r: any) => ({
      url: `${baseUrl}/restaurants/${encodeURIComponent(r.slug)}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) ?? [];

  return [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/restaurants`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/cookies`, changeFrequency: "yearly", priority: 0.2 },
    ...restaurantUrls,
  ];
}

