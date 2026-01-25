import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewReservationFlow } from "@/components/reservation/NewReservationFlow";

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

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant || !restaurant.is_active) notFound();

  const a: any = restaurant.address ?? {};
  const addressStr = [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");

  return (
    <NewReservationFlow
      summary={{
        restaurant: {
          id: restaurant.id,
          slug: restaurant.slug,
          name: restaurant.name,
          address: addressStr || "Address coming soon",
          phone: restaurant.phone,
          image: (restaurant.images ?? [])[0] ?? null,
        },
      }}
    />
  );
}

