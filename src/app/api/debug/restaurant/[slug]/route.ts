import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export async function GET(request: Request, context: { params: { slug: string } }) {
  const slug = context.params.slug;
  const supabase = createSupabasePublicClient();

  // Try to find the restaurant
  const { data: restaurant, error } = await supabase
    .from("restaurants_with_rating")
    .select("id,name,slug,is_active,cuisine_types,address")
    .eq("slug", slug)
    .maybeSingle();

  // Also check without is_active filter
  const { data: allRestaurants } = await supabase
    .from("restaurants")
    .select("id,name,slug,is_active")
    .eq("slug", slug)
    .maybeSingle();

  // Check for similar slugs
  const { data: similar } = await supabase
    .from("restaurants")
    .select("id,name,slug,is_active")
    .ilike("slug", `%${slug}%`)
    .limit(5);

  return NextResponse.json({
    requestedSlug: slug,
    foundInView: restaurant ? { ...restaurant, found: true } : { found: false, error: error?.message },
    foundInTable: allRestaurants || { found: false },
    similarSlugs: similar || [],
    query: {
      viewQuery: "restaurants_with_rating WHERE slug = ? AND is_active = true",
      tableQuery: "restaurants WHERE slug = ?",
    },
  });
}
