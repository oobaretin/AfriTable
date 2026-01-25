import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";
import { ReviewForm } from "@/components/review/ReviewForm";

export default async function NewReviewPage({ params }: { params: { reservationId: string } }) {
  const user = await requireAuth("/login?redirectTo=/reviews");
  const supabase = createSupabaseServerClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id,restaurant_id,status,reservation_date,user_id")
    .eq("id", params.reservationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reservation) notFound();
  if (reservation.status !== "completed") redirect("/reservations");

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("reservation_id", reservation.id)
    .maybeSingle();
  if (existing) redirect(`/reviews`);

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name,slug")
    .eq("id", reservation.restaurant_id)
    .maybeSingle();
  if (!restaurant) notFound();

  return (
    <ReviewForm
      reservationId={reservation.id}
      restaurant={{ name: restaurant.name, slug: restaurant.slug }}
      dateDined={format(parseISO(reservation.reservation_date), "MMM d, yyyy")}
    />
  );
}

