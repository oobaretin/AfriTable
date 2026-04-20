import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";
import { sendReactEmail } from "@/lib/email/send-react-email";
import { ReservationConfirmationEmail } from "@/lib/emails/reservation-confirmation";
import { buildCalendarLinks, buildICS } from "@/lib/email/calendar";

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const user = await requireAuth("/login?redirectTo=/reservations");
  const supabase = createSupabaseServerClient();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", context.params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "lookup_failed", message: error.message }, { status: 500 });
  if (!reservation) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { error: updateError } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservation.id);
  if (updateError) return NextResponse.json({ error: "cancel_failed", message: updateError.message }, { status: 400 });

  // Email: reuse confirmation template but with subject (MVP)
  try {
    const admin = createSupabaseAdminClient();
    const { data: restaurant } = await admin
      .from("restaurants")
      .select("name,address,phone,images")
      .eq("id", reservation.restaurant_id)
      .maybeSingle();

    if (restaurant) {
      const a: any = restaurant.address ?? {};
      const addressStr = [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const start = new Date(`${reservation.reservation_date}T${String(reservation.reservation_time).slice(0, 5)}:00`);
      const links = buildCalendarLinks({
        title: `AfriTable: ${restaurant.name}`,
        description: `Cancelled reservation. Confirmation: ${String(reservation.id).split("-")[0].toUpperCase()}`,
        location: addressStr || "Address coming soon",
        start,
        durationMinutes: 90,
      });
      const ics = buildICS({
        uid: reservation.id,
        title: `CANCELLED: AfriTable: ${restaurant.name}`,
        description: `This reservation has been cancelled.`,
        location: addressStr || "Address coming soon",
        start,
        durationMinutes: 90,
      });

      await sendReactEmail({
        to: reservation.guest_email ?? user.email ?? "",
        subject: `Reservation cancelled: ${restaurant.name}`,
        react: ReservationConfirmationEmail({
          appBaseUrl,
          restaurantName: restaurant.name,
          restaurantAddress: addressStr || "Address coming soon",
          restaurantPhone: restaurant.phone,
          reservationId: reservation.id,
          confirmationCode: String(reservation.id).split("-")[0].toUpperCase(),
          date: reservation.reservation_date,
          time: String(reservation.reservation_time).slice(0, 5),
          partySize: reservation.party_size,
          guestName: reservation.guest_name ?? user.email ?? "Guest",
          specialRequests: reservation.special_requests,
          addToCalendarUrl: links.google,
        }),
        attachments: [
          {
            filename: `afritable-cancelled-${String(reservation.id).split("-")[0].toUpperCase()}.ics`,
            content: Buffer.from(ics, "utf-8"),
          },
        ],
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}

