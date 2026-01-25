import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { buildCalendarLinks, buildICS } from "@/lib/email/calendar";
import { ReservationConfirmationEmail } from "@/lib/emails/reservation-confirmation";
import { rateLimitOrPass } from "@/lib/security/rateLimit";

const payloadSchema = z.object({
  restaurantSlug: z.string().min(1),
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  time: z.string().regex(/^\\d{2}:\\d{2}$/),
  partySize: z.union([z.number().int().min(1).max(20), z.literal("20+")]),
  guest: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
  }),
  specialRequests: z.string().max(500).optional().nullable(),
  occasion: z.enum(["Birthday", "Anniversary", "Date Night", "Business", "Celebration", "Other", "None"]).optional().nullable(),
  smsOptIn: z.boolean().optional().default(false),
  createAccount: z.boolean().optional().default(false),
});

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`reservation:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: rl.message },
      { status: rl.status, headers: rl.retryAfterSeconds ? { "Retry-After": String(rl.retryAfterSeconds) } : undefined }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const partySize = body.partySize === "20+" ? 20 : body.partySize;
  const guestName = `${body.guest.firstName} ${body.guest.lastName}`.trim();

  // Identify logged-in user if present (optional)
  const supabaseSSR = createSupabaseServerClient();
  const { data: authData } = await supabaseSSR.auth.getUser();
  const sessionUser = authData.user ?? null;

  const supabaseAdmin = createSupabaseAdminClient();

  // Resolve restaurant by slug
  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from("restaurants_with_rating")
    .select("id,name,address,phone,images,is_active")
    .eq("slug", body.restaurantSlug)
    .maybeSingle();

  if (restaurantError) return NextResponse.json({ error: "restaurant_lookup_failed" }, { status: 500 });
  if (!restaurant || !restaurant.is_active) return NextResponse.json({ error: "restaurant_not_found" }, { status: 404 });

  let userId: string | null = sessionUser?.id ?? null;

  // Optional account creation for guests: invite user by email (passwordless)
  if (!userId && body.createAccount) {
    const invite = await supabaseAdmin.auth.admin.inviteUserByEmail(body.guest.email, {
      data: {
        full_name: guestName,
        phone: body.guest.phone,
        role: "diner",
      },
    });

    if (invite.error) {
      return NextResponse.json({ error: "account_invite_failed", message: invite.error.message }, { status: 400 });
    }

    userId = invite.data.user?.id ?? null;
  }

  // Create reservation atomically via RPC (prevents double-booking)
  const { data: reservation, error: rpcError } = await supabaseAdmin.rpc("create_reservation", {
    p_restaurant_id: restaurant.id,
    p_reservation_date: body.date,
    p_reservation_time: body.time,
    p_party_size: partySize,
    p_guest_name: guestName,
    p_guest_email: body.guest.email,
    p_guest_phone: body.guest.phone,
    p_special_requests: body.specialRequests ?? null,
    p_occasion: body.occasion && body.occasion !== "None" ? body.occasion : null,
    p_user_id: userId,
  });

  if (rpcError) {
    const message = rpcError.message || "Unable to create reservation";
    const code =
      message.includes("no_availability")
        ? "no_availability"
        : message.includes("outside_operating_hours")
          ? "outside_operating_hours"
          : message.includes("closed_on_selected_day")
            ? "closed_on_selected_day"
            : message.includes("within_same_day_cutoff")
              ? "within_same_day_cutoff"
              : message.includes("outside_advance_window")
                ? "outside_advance_window"
                : message.includes("party_size_exceeds_limit")
                  ? "party_size_exceeds_limit"
                  : message.includes("restaurant_not_accepting_reservations")
                    ? "restaurant_not_accepting_reservations"
                    : "unknown";

    // Suggest next available time for the same day if no availability
    const suggestion: { suggestedTime?: string } = {};
    if (code === "no_availability") {
      const { data: avail } = await supabaseAdmin
        .from("availability_settings")
        .select("slot_duration_minutes,operating_hours")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();
      const { data: tables } = await supabaseAdmin
        .from("restaurant_tables")
        .select("capacity,is_active")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true);
      const { data: reservations } = await supabaseAdmin
        .from("reservations")
        .select("reservation_time,status")
        .eq("restaurant_id", restaurant.id)
        .eq("reservation_date", body.date)
        .in("status", ["pending", "confirmed", "seated"]);

      const { calculateAvailableTimeSlots } = await import("@/lib/reservation/availability");
      const operatingHours = (avail?.operating_hours as any) ?? [];
      const eligibleTableCount = (tables ?? []).filter((t: any) => (t?.capacity ?? 0) >= partySize && t?.is_active !== false).length;
      const reservationCountsByTime: Record<string, number> = {};
      for (const r of reservations ?? []) {
        const t = String((r as any).reservation_time).slice(0, 5);
        reservationCountsByTime[t] = (reservationCountsByTime[t] ?? 0) + 1;
      }
      const slots = calculateAvailableTimeSlots({
        date: new Date(body.date + "T00:00:00"),
        operatingHours,
        slotDurationMinutes: avail?.slot_duration_minutes ?? 90,
        eligibleTableCount,
        reservationCountsByTime,
      });
      const next = slots.find((s) => s.status !== "unavailable" && s.availableTables > 0);
      if (next) suggestion.suggestedTime = next.time;
    }

    const status =
      code === "no_availability" ||
      code === "outside_operating_hours" ||
      code === "closed_on_selected_day" ||
      code === "within_same_day_cutoff" ||
      code === "outside_advance_window"
        ? 409
        : 400;
    return NextResponse.json({ error: "reservation_failed", code, message, ...suggestion }, { status });
  }

  const confirmationCode = String(reservation.id).split("-")[0].toUpperCase();
  const addressStr = (() => {
    const a: any = restaurant.address ?? {};
    return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
  })();

  // Send confirmation email (best-effort)
  try {
    const resend = new Resend(requireEnv("RESEND_API_KEY"));
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const start = new Date(`${body.date}T${body.time}:00`);
    const links = buildCalendarLinks({
      title: `AfriTable: ${restaurant.name}`,
      description: `Reservation for ${partySize} at ${restaurant.name}. Confirmation: ${confirmationCode}`,
      location: addressStr || "Address coming soon",
      start,
      durationMinutes: 90,
    });

    const ics = buildICS({
      uid: reservation.id,
      title: `AfriTable: ${restaurant.name}`,
      description: `Reservation for ${partySize} at ${restaurant.name}. Confirmation: ${confirmationCode}`,
      location: addressStr || "Address coming soon",
      start,
      durationMinutes: 90,
    });

    await resend.emails.send({
      from: requireEnv("RESEND_FROM_EMAIL"),
      to: body.guest.email,
      subject: `Reservation confirmed: ${restaurant.name}`,
      react: ReservationConfirmationEmail({
        appBaseUrl,
        restaurantName: restaurant.name,
        restaurantAddress: addressStr || "Address coming soon",
        restaurantPhone: restaurant.phone,
        reservationId: reservation.id,
        confirmationCode,
        date: body.date,
        time: body.time,
        partySize,
        guestName,
        specialRequests: body.specialRequests ?? null,
        addToCalendarUrl: links.google,
      }),
      attachments: [
        {
          filename: `afritable-reservation-${confirmationCode}.ics`,
          content: Buffer.from(ics).toString("base64"),
        },
      ],
    });
  } catch {
    // no-op (don't block booking)
  }

  return NextResponse.json({
    reservation: {
      id: reservation.id,
      confirmationCode,
      status: reservation.status,
      reservation_date: reservation.reservation_date,
      reservation_time: String(reservation.reservation_time).slice(0, 5),
      party_size: reservation.party_size,
      special_requests: reservation.special_requests,
      occasion: reservation.occasion,
    },
    restaurant: {
      slug: body.restaurantSlug,
      id: restaurant.id,
      name: restaurant.name,
      address: addressStr,
      phone: restaurant.phone,
      image: (restaurant.images ?? [])[0] ?? null,
    },
    user: {
      id: userId,
      isLoggedIn: Boolean(sessionUser),
      invitedAccount: Boolean(!sessionUser && body.createAccount && userId),
    },
  });
}

