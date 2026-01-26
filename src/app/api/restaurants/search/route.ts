import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  city: z.string().optional(),
  zip: z.string().optional(),
  cuisine: z.string().optional(), // comma-separated
  price: z.string().optional(), // comma-separated (1-4)
  minRating: z.string().optional(), // e.g. "4"
  sort: z.string().optional(), // recommended|rating|price_asc|price_desc|new
  page: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "invalid_query" }, { status: 400 });

  const page = Math.max(1, Number(parsed.data.page ?? "1") || 1);
  const limit = Math.min(50, Math.max(1, Number(parsed.data.limit ?? "20") || 20));

  const cuisines = (parsed.data.cuisine ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const prices = (parsed.data.price ?? "")
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 4);
  const minRating = Number(parsed.data.minRating ?? "");
  const city = parsed.data.city?.toLowerCase();
  const zip = parsed.data.zip?.toLowerCase();

  const sort = parsed.data.sort ?? "recommended";

  // Public endpoint: avoid cookie/session SSR client to prevent subtle dev-time
  // issues; use a pure anon client.
  const supabase = createSupabasePublicClient();

  // Dev-only debug hook to diagnose "0 restaurants found" quickly.
  if (process.env.NODE_ENV !== "production" && url.searchParams.get("debug") === "1") {
    const [v, t] = await Promise.all([
      supabase.from("restaurants_with_rating").select("id,name,is_active,address").limit(3),
      supabase.from("restaurants").select("id,name,is_active,address").limit(3),
    ]);
    const normal = await supabase
      .from("restaurants_with_rating")
      .select("id,name,is_active,address,avg_rating,created_at")
      .eq("is_active", true)
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(10);
    return NextResponse.json({
      env: {
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        anonPrefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").slice(0, 12),
      },
      restaurants_with_rating: { count: v.data?.length ?? 0, error: v.error?.message ?? null, sample: v.data ?? [] },
      restaurants: { count: t.data?.length ?? 0, error: t.error?.message ?? null, sample: t.data ?? [] },
      normalQuery: { count: normal.data?.length ?? 0, error: normal.error?.message ?? null, sample: normal.data ?? [] },
    });
  }

  const { data, error } = await supabase
    .from("restaurants_with_rating")
    .select("id,slug,name,cuisine_types,price_range,address,images,avg_rating,review_count,is_active,created_at")
    .eq("is_active", true)
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: "query_failed", message: error.message }, { status: 500 });

  let rows = (data ?? []).filter((r: any) => r.is_active);

  if (cuisines.length) {
    const set = new Set(cuisines.map((c) => decodeURIComponent(c).toLowerCase()));
    rows = rows.filter((r: any) => (r.cuisine_types ?? []).some((c: string) => set.has(c.toLowerCase())));
  }
  if (prices.length) {
    const set = new Set(prices);
    rows = rows.filter((r: any) => set.has(r.price_range));
  }
  if (Number.isFinite(minRating)) {
    rows = rows.filter((r: any) => (r.avg_rating ?? 0) >= minRating);
  }
  if (city || zip) {
    rows = rows.filter((r: any) => {
      const a: any = r.address ?? {};
      const addrCity = typeof a.city === "string" ? a.city.toLowerCase() : "";
      const addrZip = typeof a.zip === "string" ? a.zip.toLowerCase() : "";
      return (city ? addrCity.includes(city) : true) && (zip ? addrZip.includes(zip) : true);
    });
  }

  if (sort === "rating") rows = rows.sort((a: any, b: any) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
  if (sort === "new") rows = rows.sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
  if (sort === "price_asc") rows = rows.sort((a: any, b: any) => a.price_range - b.price_range);
  if (sort === "price_desc") rows = rows.sort((a: any, b: any) => b.price_range - a.price_range);

  const total = rows.length;
  const start = (page - 1) * limit;
  const items = rows.slice(start, start + limit);

  return NextResponse.json({ total, page, limit, items });
}

