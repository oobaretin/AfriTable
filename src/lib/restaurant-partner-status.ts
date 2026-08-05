import { createSupabasePublicClient } from "@/lib/supabase/public";

export type LivePartnerStatus = {
  dbRestaurantId: string | null;
  isLivePartner: boolean;
  isClaimed: boolean;
  onlineReservationsEnabled: boolean;
};

/**
 * A restaurant is a live booking partner only when it is claimed by an owner
 * and has online reservations enabled. Synced catalog rows in Supabase are not partners.
 */
export async function getLivePartnerStatus(slugOrId: string, knownDbId?: string | null): Promise<LivePartnerStatus> {
  const supabase = createSupabasePublicClient();

  let dbRestaurantId = knownDbId ?? null;
  if (!dbRestaurantId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
    if (isUuid) {
      dbRestaurantId = slugOrId;
    } else {
      const { data } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", slugOrId)
        .eq("is_active", true)
        .maybeSingle();
      dbRestaurantId = data?.id ?? null;
    }
  }

  if (!dbRestaurantId) {
    return {
      dbRestaurantId: null,
      isLivePartner: false,
      isClaimed: false,
      onlineReservationsEnabled: false,
    };
  }

  const [{ data: restaurant }, { data: settings }] = await Promise.all([
    supabase.from("restaurants").select("is_claimed").eq("id", dbRestaurantId).maybeSingle(),
    supabase.from("availability_settings").select("*").eq("restaurant_id", dbRestaurantId).maybeSingle(),
  ]);

  const isClaimed = Boolean((restaurant as { is_claimed?: boolean } | null)?.is_claimed);
  const onlineReservationsEnabled =
    (settings as { online_reservations_enabled?: boolean } | null)?.online_reservations_enabled !== false;
  const isLivePartner = isClaimed && onlineReservationsEnabled;

  return {
    dbRestaurantId,
    isLivePartner,
    isClaimed,
    onlineReservationsEnabled,
  };
}

/** Slugs with live AfriTable booking (claimed + online reservations). */
export async function getLivePartnerSlugSet(): Promise<Set<string>> {
  const supabase = createSupabasePublicClient();
  const { data: claimed } = await supabase
    .from("restaurants")
    .select("id, slug")
    .eq("is_active", true)
    .eq("is_claimed", true);

  if (!claimed?.length) return new Set();

  const ids = claimed.map((r) => r.id);
  const { data: settings } = await supabase
    .from("availability_settings")
    .select("restaurant_id, online_reservations_enabled")
    .in("restaurant_id", ids);

  const reservationsOff = new Set(
    (settings ?? [])
      .filter((s) => (s as { online_reservations_enabled?: boolean }).online_reservations_enabled === false)
      .map((s) => (s as { restaurant_id: string }).restaurant_id),
  );

  const slugs = new Set<string>();
  for (const r of claimed) {
    if (!reservationsOff.has(r.id) && r.slug) slugs.add(r.slug);
  }
  return slugs;
}
