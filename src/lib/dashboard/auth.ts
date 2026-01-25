import "server-only";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OwnerContext = {
  userId: string;
  restaurantId: string;
};

export async function requireRestaurantOwner(restaurantId?: string | null): Promise<OwnerContext> {
  const supabase = createSupabaseServerClient();
  const { data: authData, error } = await supabase.auth.getUser();
  const user = authData.user;
  if (error || !user) throw new Error("unauthenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "restaurant_owner") throw new Error("forbidden");

  if (restaurantId) {
    const { data: owned } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!owned) throw new Error("forbidden");
    return { userId: user.id, restaurantId };
  }

  // Default to the most recently created restaurant owned by user
  const { data: first } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!first) throw new Error("no_restaurant");
  return { userId: user.id, restaurantId: first.id };
}

export function assertSameOrigin() {
  const h = headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!origin || !host) return;
  try {
    const o = new URL(origin);
    if (o.host !== host) throw new Error("csrf");
  } catch {
    throw new Error("csrf");
  }
}

