import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";

/**
 * Diagnostic endpoint to check environment variables and database connectivity
 * Visit: /api/diagnose
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // Check environment variables (without exposing full values)
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  diagnostics.checks.env = {
    hasSupabaseUrl,
    hasAnonKey,
    hasServiceKey,
    supabaseUrlPrefix: hasSupabaseUrl
      ? process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "..."
      : "MISSING",
    anonKeyPrefix: hasAnonKey
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 12) + "..."
      : "MISSING",
  };

  // Test database connection
  if (hasSupabaseUrl && hasAnonKey) {
    try {
      const supabase = createSupabasePublicClient();

      // Test 1: Simple query
      const { data: testData, error: testError } = await supabase
        .from("restaurants")
        .select("id, name, is_active")
        .limit(1);

      diagnostics.checks.directQuery = {
        success: !testError,
        error: testError?.message || null,
        found: testData?.length || 0,
      };

      // Test 2: View query (what the site actually uses)
      const { data: viewData, error: viewError } = await supabase
        .from("restaurants_with_rating")
        .select("id, name, slug, is_active")
        .eq("is_active", true)
        .limit(10);

      diagnostics.checks.viewQuery = {
        success: !viewError,
        error: viewError?.message || null,
        found: viewData?.length || 0,
        sample: viewData?.slice(0, 3).map((r: any) => ({
          name: r.name,
          slug: r.slug,
        })) || [],
      };

      // Test 3: Count all active restaurants
      const { count, error: countError } = await supabase
        .from("restaurants_with_rating")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      diagnostics.checks.count = {
        success: !countError,
        error: countError?.message || null,
        totalActive: count || 0,
      };
    } catch (err) {
      diagnostics.checks.database = {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  } else {
    diagnostics.checks.database = {
      success: false,
      error: "Missing environment variables - cannot test database",
    };
  }

  // Determine overall status
  const allChecksPass =
    diagnostics.checks.env?.hasSupabaseUrl &&
    diagnostics.checks.env?.hasAnonKey &&
    diagnostics.checks.viewQuery?.success &&
    diagnostics.checks.count?.totalActive > 0;

  diagnostics.status = allChecksPass ? "healthy" : "issues_detected";
  diagnostics.recommendations = [];

  if (!hasSupabaseUrl) {
    diagnostics.recommendations.push(
      "Set NEXT_PUBLIC_SUPABASE_URL in Vercel environment variables",
    );
  }
  if (!hasAnonKey) {
    diagnostics.recommendations.push(
      "Set NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables",
    );
  }
  if (diagnostics.checks.viewQuery?.error) {
    diagnostics.recommendations.push(
      `Database query error: ${diagnostics.checks.viewQuery.error}. Check RLS policies.`,
    );
  }
  if (diagnostics.checks.count?.totalActive === 0) {
    diagnostics.recommendations.push(
      "No active restaurants found. Run: npm run activate:restaurants",
    );
  }

  return NextResponse.json(diagnostics, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
