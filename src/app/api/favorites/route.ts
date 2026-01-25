import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";
import { rateLimitOrPass } from "@/lib/security/rateLimit";

const schema = z.object({
  restaurantId: z.string().uuid(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`favorites:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: rl.message },
      { status: rl.status, headers: rl.retryAfterSeconds ? { "Retry-After": String(rl.retryAfterSeconds) } : undefined }
    );
  }

  const user = await requireAuth("/login");
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, restaurant_id: parsed.data.restaurantId });

  if (error) return NextResponse.json({ error: "create_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

