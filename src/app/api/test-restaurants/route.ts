import { createSupabasePublicClient } from "@/lib/supabase/public";
import { NextResponse } from "next/server";

/**
 * Test endpoint to verify restaurant queries work in production.
 * Visit: /api/test-restaurants
 */
export async function GET() {
  try {
    const supabase = createSupabasePublicClient();

    // Test 1: Direct restaurants query
    const { data: directData, error: directError, count: directCount } = await supabase
      .from("restaurants")
      .select("id, name, slug, is_active", { count: "exact" })
      .eq("is_active", true)
      .limit(5);

    // Test 2: View query (what homepage uses)
    const { data: viewData, error: viewError } = await supabase
      .from("restaurants_with_rating")
      .select("id,name,slug,cuisine_types,price_range,address,images,created_at,avg_rating,review_count")
      .eq("is_active", true)
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12);

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        directQuery: {
          success: !directError,
          error: directError
            ? {
                message: directError.message,
                details: directError.details,
                hint: directError.hint,
                code: directError.code,
              }
            : null,
          count: directCount || 0,
          sample: directData?.slice(0, 3) || [],
        },
        viewQuery: {
          success: !viewError,
          error: viewError
            ? {
                message: viewError.message,
                details: viewError.details,
                hint: viewError.hint,
                code: viewError.code,
              }
            : null,
          count: viewData?.length || 0,
          sample: viewData?.slice(0, 3) || [],
        },
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || "missing",
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
