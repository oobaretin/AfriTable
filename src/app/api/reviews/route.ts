import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";
import { rateLimitOrPass } from "@/lib/security/rateLimit";

const createSchema = z.object({
  reservationId: z.string().uuid(),
  overall_rating: z.number().int().min(1).max(5),
  food_rating: z.number().int().min(1).max(5).optional().nullable(),
  service_rating: z.number().int().min(1).max(5).optional().nullable(),
  ambiance_rating: z.number().int().min(1).max(5).optional().nullable(),
  review_text: z.string().min(50).max(2000),
  photos: z.array(z.string().min(1)).max(5).optional().default([]),
  recommended_dishes: z.string().max(300).optional().nullable(),
  would_recommend: z.boolean().optional().nullable(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`reviews:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: rl.message },
      { status: rl.status, headers: rl.retryAfterSeconds ? { "Retry-After": String(rl.retryAfterSeconds) } : undefined }
    );
  }

  const user = await requireAuth("/login?redirectTo=/reviews");
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseServerClient();

  // Validate reservation ownership + completion
  const { data: reservation, error: resErr } = await supabase
    .from("reservations")
    .select("id,restaurant_id,user_id,status,reservation_date")
    .eq("id", parsed.data.reservationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (resErr) return NextResponse.json({ error: "lookup_failed", message: resErr.message }, { status: 500 });
  if (!reservation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (reservation.status !== "completed") return NextResponse.json({ error: "not_eligible" }, { status: 409 });

  // Prevent double review
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reservation_id", reservation.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "already_reviewed" }, { status: 409 });

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      reservation_id: reservation.id,
      user_id: user.id,
      restaurant_id: reservation.restaurant_id,
      overall_rating: parsed.data.overall_rating,
      food_rating: parsed.data.food_rating ?? null,
      service_rating: parsed.data.service_rating ?? null,
      ambiance_rating: parsed.data.ambiance_rating ?? null,
      review_text: parsed.data.review_text,
      photos: parsed.data.photos ?? [],
      recommended_dishes: parsed.data.recommended_dishes ?? null,
      would_recommend: parsed.data.would_recommend ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "create_failed", message: error.message }, { status: 400 });

  return NextResponse.json({ review });
}

