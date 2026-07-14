import { createSupabaseAdminClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRestaurantUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Resolve catalog slug or UUID to an active Supabase restaurant id (for favorites, reviews, etc.). */
export async function resolveActiveRestaurantUuid(slugOrId: string): Promise<string | null> {
  const trimmed = slugOrId.trim();
  if (!trimmed) return null;
  if (isRestaurantUuid(trimmed)) return trimmed;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", trimmed)
    .eq("is_active", true)
    .maybeSingle();

  return data?.id ?? null;
}
