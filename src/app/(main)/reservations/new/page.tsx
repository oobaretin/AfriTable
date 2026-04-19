import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewReservationFlow } from "@/components/reservation/NewReservationFlow";
import { getRestaurantByIdFromJSON } from "@/lib/restaurant-json-loader-server";
import { transformJSONRestaurantToDetail } from "@/lib/restaurant-json-loader";

async function getRestaurantBySlug(slug: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id,slug,name,address,phone,images,is_active")
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

  const dbRestaurant = await getRestaurantBySlug(slug);
  if (dbRestaurant?.is_active) {
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

  const jsonRestaurant = getRestaurantByIdFromJSON(slug);
  if (!jsonRestaurant) notFound();

  const detail = transformJSONRestaurantToDetail(jsonRestaurant) as any;
  const a: any = detail.address ?? {};
  const addressStr = [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");

  return (
    <NewReservationFlow
      summary={{
        restaurant: {
          id: detail.id,
          slug: detail.slug ?? detail.id,
          name: detail.name,
          address: addressStr || "Address coming soon",
          phone: detail.phone,
          image: (detail.images ?? [])[0] ?? null,
        },
      }}
    />
  );
}

