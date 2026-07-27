import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewReservationFlow } from "@/components/reservation/NewReservationFlow";
import { getRestaurantByIdFromJSON } from "@/lib/restaurant-json-loader-server";
import { getLivePartnerStatus } from "@/lib/restaurant-partner-status";

async function getRestaurantBySlug(slug: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id,slug,name,address,phone,images,is_active,is_claimed")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: { restaurant?: string; date?: string; time?: string; party?: string };
}) {
  const slug = searchParams.restaurant;
  if (!slug) notFound();

  const partnerStatus = await getLivePartnerStatus(slug);
  if (!partnerStatus.isLivePartner) {
    const jsonRestaurant = getRestaurantByIdFromJSON(slug);
    if (jsonRestaurant) {
      redirect(`/restaurants/${encodeURIComponent(slug)}`);
    }
    notFound();
  }

  const dbRestaurant = await getRestaurantBySlug(slug);
  if (!dbRestaurant?.is_active) notFound();

  const a: any = dbRestaurant.address ?? {};
  const addressStr = [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
  return (
    <NewReservationFlow
      summary={{
        restaurant: {
          id: dbRestaurant.id,
          slug: dbRestaurant.slug,
          name: dbRestaurant.name,
          address: addressStr || "Address coming soon",
          phone: dbRestaurant.phone,
          image: (dbRestaurant.images ?? [])[0] ?? null,
        },
      }}
    />
  );
}
