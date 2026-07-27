import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimitOrPass } from "@/lib/security/rateLimit";
import { getRestaurantByIdFromJSON } from "@/lib/restaurant-json-loader-server";
import { transformJSONRestaurantToDetail } from "@/lib/restaurant-json-loader";
import { getLivePartnerStatus } from "@/lib/restaurant-partner-status";
import { sendReactEmail } from "@/lib/email/send-react-email";
import { sendSiteInboxNotification, escapeHtml } from "@/lib/email/site-inbox";
import { ReservationConfirmationEmail } from "@/lib/emails/reservation-confirmation";
import { getAppBaseUrl } from "@/lib/app-url";

const TIME_LABELS: Record<string, string> = {
  morning: "Morning (before 12pm)",
  afternoon: "Afternoon (12pm – 5pm)",
  evening: "Evening (after 5pm)",
  flexible: "Flexible",
};

const payloadSchema = z.object({
  restaurantSlug: z.string().min(1),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timePreference: z.enum(["morning", "afternoon", "evening", "flexible"]),
  partySize: z.number().int().min(1).max(20),
  guest: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
  }),
  specialRequests: z.string().max(500).optional().nullable(),
  notifyWhenLive: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitOrPass(`table-request:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: rl.message },
      { status: rl.status, headers: rl.retryAfterSeconds ? { "Retry-After": String(rl.retryAfterSeconds) } : undefined },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const guestName = `${body.guest.firstName} ${body.guest.lastName}`.trim();
  const catalogRestaurant = getRestaurantByIdFromJSON(body.restaurantSlug);

  if (!catalogRestaurant) {
    return NextResponse.json({ error: "restaurant_not_found" }, { status: 404 });
  }

  const partnerStatus = await getLivePartnerStatus(body.restaurantSlug);
  if (partnerStatus.isLivePartner) {
    return NextResponse.json(
      {
        error: "live_partner",
        message: "This restaurant accepts live bookings. Use the reservation widget instead.",
      },
      { status: 409 },
    );
  }

  const detail = transformJSONRestaurantToDetail(catalogRestaurant) as {
    name: string;
    phone?: string | null;
    address?: { street?: string; city?: string; state?: string; zip?: string };
  };
  const a = detail.address ?? {};
  const addressStr = [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
  const timeLabel = TIME_LABELS[body.timePreference] ?? body.timePreference;

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("table_requests")
    .insert({
      restaurant_slug: body.restaurantSlug,
      restaurant_name: detail.name,
      restaurant_id: partnerStatus.dbRestaurantId,
      preferred_date: body.preferredDate,
      time_preference: body.timePreference,
      party_size: body.partySize,
      guest_name: guestName,
      guest_email: body.guest.email,
      guest_phone: body.guest.phone,
      special_requests: body.specialRequests ?? null,
      notify_when_live: body.notifyWhenLive,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    console.error("[table-requests] insert failed:", insertError);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  const referenceCode = String(inserted.id).replace(/-/g, "").slice(0, 8).toUpperCase();
  const appBaseUrl = getAppBaseUrl();
  const restaurantPageUrl = `${appBaseUrl}/restaurants/${encodeURIComponent(body.restaurantSlug)}`;

  // Guest confirmation (best-effort)
  try {
    await sendReactEmail({
      to: body.guest.email,
      subject: `Table request received: ${detail.name}`,
      react: ReservationConfirmationEmail({
        appBaseUrl,
        restaurantName: detail.name,
        restaurantAddress: addressStr || "Address coming soon",
        restaurantPhone: detail.phone,
        reservationId: inserted.id,
        confirmationCode: referenceCode,
        date: body.preferredDate,
        time: body.timePreference === "flexible" ? "Flexible" : timeLabel,
        partySize: body.partySize,
        guestName,
        specialRequests: body.specialRequests ?? null,
        addToCalendarUrl: restaurantPageUrl,
        showManageLinks: false,
        confirmationKind: "request",
      }),
    });
  } catch {
    // no-op
  }

  // Internal notification for AfriTable team to forward to restaurant
  const inboxHtml = `
    <h2>New catalog table request</h2>
    <p><strong>Restaurant:</strong> ${escapeHtml(detail.name)} (${escapeHtml(body.restaurantSlug)})</p>
    <p><strong>Preferred:</strong> ${escapeHtml(body.preferredDate)} · ${escapeHtml(timeLabel)} · ${body.partySize} guests</p>
    <p><strong>Guest:</strong> ${escapeHtml(guestName)}</p>
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(body.guest.email)}">${escapeHtml(body.guest.email)}</a></p>
    <p><strong>Phone:</strong> ${escapeHtml(body.guest.phone)}</p>
    ${detail.phone ? `<p><strong>Restaurant phone:</strong> ${escapeHtml(detail.phone)}</p>` : ""}
    ${body.specialRequests ? `<p><strong>Notes:</strong> ${escapeHtml(body.specialRequests)}</p>` : ""}
    ${body.notifyWhenLive ? `<p><em>Guest asked to be notified when live booking opens.</em></p>` : ""}
    <p><strong>Reference:</strong> ${escapeHtml(referenceCode)}</p>
    <p><a href="${escapeHtml(restaurantPageUrl)}">View listing</a></p>
  `;

  await sendSiteInboxNotification({
    subject: `[Table request] ${detail.name} — ${body.preferredDate}`,
    htmlBody: inboxHtml,
    replyTo: body.guest.email,
  });

  return NextResponse.json({
    id: inserted.id,
    referenceCode,
    status: "request_received",
  });
}
