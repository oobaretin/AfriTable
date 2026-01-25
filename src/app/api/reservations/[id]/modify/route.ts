import { NextResponse } from "next/server";
import { z } from "zod";
import { addHours, isBefore } from "date-fns";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/utils";
import { Resend } from "resend";
import { ReservationConfirmationEmail } from "@/lib/emails/reservation-confirmation";
import { buildCalendarLinks, buildICS } from "@/lib/email/calendar";

const payloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.union([z.number().int().min(1).max(20), z.literal("20+")]),
});

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const user = await requireAuth("/login?redirectTo=/reservations");
  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", context.params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "lookup_failed", message: error.message }, { status: 500 });
  if (!reservation) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 2 hour cutoff
  const existingStart = new Date(`${reservation.reservation_date}T${String(reservation.reservation_time).slice(0, 5)}:00`);
  if (!isBefore(addHours(new Date(), 2), existingStart)) {
    return NextResponse.json({ error: "too_late_to_modify", message: "Changes are allowed up to 2 hours before." }, { status: 409 });
  }

  const partySize = parsed.data.partySize === "20+" ? 20 : parsed.data.partySize;

  // Availability check using the existing create_reservation RPC logic by calling it "dry-run" style isn't available,
  // so for MVP we re-check using the availability endpoint logic with admin client.
  const admin = createSupabaseAdminClient();
  const { data: settings } = await admin
    .from("availability_settings")
    .select("slot_duration_minutes,operating_hours,max_party_size")
    .eq("restaurant_id", reservation.restaurant_id)
    .maybeSingle();
  if (!settings) return NextResponse.json({ error: "restaurant_not_accepting_reservations" }, { status: 409 });
  if (partySize > (settings.max_party_size ?? 20)) {
    return NextResponse.json({ error: "party_size_exceeds_limit" }, { status: 409 });
  }

  // Count eligible tables
  const { data: tables } = await admin
    .from("restaurant_tables")
    .select("capacity,is_active")
    .eq("restaurant_id", reservation.restaurant_id)
    .eq("is_active", true);
  const eligibleTableCount = (tables ?? []).filter((t: any) => (t?.capacity ?? 0) >= partySize).length;
  if (eligibleTableCount <= 0) return NextResponse.json({ error: "no_table_for_party_size" }, { status: 409 });

  // Count overlapping reservations excluding this reservation
  const { data: existing } = await admin
    .from("reservations")
    .select("reservation_time,status,id")
    .eq("restaurant_id", reservation.restaurant_id)
    .eq("reservation_date", parsed.data.date)
    .in("status", ["pending", "confirmed", "seated"]);
  const reserved = (existing ?? []).filter((r: any) => r.id !== reservation.id && String(r.reservation_time).slice(0, 5) === parsed.data.time).length;
  if (eligibleTableCount - reserved <= 0) {
    return NextResponse.json({ error: "no_availability", message: "No availability for that time." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("reservations")
    .update({ reservation_date: parsed.data.date, reservation_time: parsed.data.time, party_size: partySize, status: "confirmed" })
    .eq("id", reservation.id);
  if (updateError) return NextResponse.json({ error: "modify_failed", message: updateError.message }, { status: 400 });

  // Email (best-effort): reuse confirmation template for MVP
  try {
    const { data: restaurant } = await admin
      .from("restaurants")
      .select("name,address,phone")
      .eq("id", reservation.restaurant_id)
      .maybeSingle();
    if (restaurant) {
      const a: any = restaurant.address ?? {};
      const addressStr = [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const start = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
      const links = buildCalendarLinks({
        title: `AfriTable: ${restaurant.name}`,
        description: `Updated reservation. Confirmation: ${String(reservation.id).split("-")[0].toUpperCase()}`,
        location: addressStr || "Address coming soon",
        start,
        durationMinutes: 90,
      });
      const ics = buildICS({
        uid: reservation.id,
        title: `UPDATED: AfriTable: ${restaurant.name}`,
        description: `Updated reservation. Confirmation: ${String(reservation.id).split("-")[0].toUpperCase()}`,
        location: addressStr || "Address coming soon",
        start,
        durationMinutes: 90,
      });
      const resend = new Resend(requireEnv("RESEND_API_KEY"));
      await resend.emails.send({
        from: requireEnv("RESEND_FROM_EMAIL"),
        to: reservation.guest_email ?? user.email ?? "",
        subject: `Reservation updated: ${restaurant.name}`,
        react: ReservationConfirmationEmail({
          appBaseUrl,
          restaurantName: restaurant.name,
          restaurantAddress: addressStr || "Address coming soon",
          restaurantPhone: restaurant.phone,
          reservationId: reservation.id,
          confirmationCode: String(reservation.id).split("-")[0].toUpperCase(),
          date: parsed.data.date,
          time: parsed.data.time,
          partySize,
          guestName: reservation.guest_name ?? user.email ?? "Guest",
          specialRequests: reservation.special_requests,
          addToCalendarUrl: links.google,
        }),
        attachments: [{ filename: `afritable-updated.ics`, content: Buffer.from(ics).toString("base64") }],
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true });
}

