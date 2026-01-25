import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";

const patchSchema = z.object({
  overall_rating: z.number().int().min(1).max(5).optional(),
  food_rating: z.number().int().min(1).max(5).nullable().optional(),
  service_rating: z.number().int().min(1).max(5).nullable().optional(),
  ambiance_rating: z.number().int().min(1).max(5).nullable().optional(),
  review_text: z.string().min(50).max(2000).optional(),
  photos: z.array(z.string().min(1)).max(5).optional(),
  recommended_dishes: z.string().max(300).nullable().optional(),
  would_recommend: z.boolean().nullable().optional(),
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  await requireAuth("/login?redirectTo=/reviews");
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .update(parsed.data)
    .eq("id", context.params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "update_failed", message: error.message }, { status: 400 });
  return NextResponse.json({ review: data });
}

