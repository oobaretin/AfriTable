import { NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { sendReactEmail } from "@/lib/email/send-react-email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ReservationReminderEmail } from "@/lib/emails/reservation-reminder";
import { ReviewRequestEmail } from "@/lib/emails/review-request";

function requireCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  const got = request.headers.get("x-cron-secret");
  if (got !== secret) throw new Error("unauthorized");
}

export async function POST(request: Request) {
  try {
    requireCronSecret(request);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const supabase = createSupabaseAdminClient();

  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const yesterday = format(addDays(new Date(), -1), "yyyy-MM-dd");

  // Reminders: tomorrow reservations (confirmed/seated/pending)
  const { data: reminderRes } = await supabase
    .from("reservations")
    .select("id,restaurant_id,guest_email,guest_name,reservation_date,reservation_time,party_size,status")
    .eq("reservation_date", tomorrow)
    .in("status", ["pending", "confirmed", "seated"]);

  // Review requests: yesterday completed reservations
  const { data: reviewRes } = await supabase
    .from("reservations")
    .select("id,restaurant_id,guest_email,guest_name,reservation_date,status")
    .eq("reservation_date", yesterday)
    .eq("status", "completed");

  const restaurantIds = Array.from(
    new Set([...(reminderRes ?? []).map((r: any) => r.restaurant_id), ...(reviewRes ?? []).map((r: any) => r.restaurant_id)]),
  );
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id,name")
    .in("id", restaurantIds);
  const restMap = new Map((restaurants ?? []).map((r: any) => [r.id, r]));

  let sentReminders = 0;
  for (const r of reminderRes ?? []) {
    const email = (r as any).guest_email;
    if (!email) continue;
    const keyType = "reminder_24h";

    // idempotency
    const { data: existing } = await supabase
      .from("reservation_notifications")
      .select("id")
      .eq("reservation_id", (r as any).id)
      .eq("type", keyType)
      .maybeSingle();
    if (existing) continue;

    const rest = restMap.get((r as any).restaurant_id);
    if (!rest) continue;

    const reminderSent = await sendReactEmail({
      to: email,
      subject: `Reminder: Your reservation at ${rest.name} tomorrow`,
      react: ReservationReminderEmail({
        appBaseUrl,
        restaurantName: rest.name,
        reservationId: (r as any).id,
        date: (r as any).reservation_date,
        time: String((r as any).reservation_time).slice(0, 5),
        partySize: (r as any).party_size,
      }),
    });

    if (reminderSent.ok) {
      await supabase.from("reservation_notifications").insert({ reservation_id: (r as any).id, type: keyType });
      sentReminders += 1;
    }
  }

  let sentReviews = 0;
  for (const r of reviewRes ?? []) {
    const email = (r as any).guest_email;
    if (!email) continue;
    const keyType = "review_request_24h";

    const { data: existing } = await supabase
      .from("reservation_notifications")
      .select("id")
      .eq("reservation_id", (r as any).id)
      .eq("type", keyType)
      .maybeSingle();
    if (existing) continue;

    const rest = restMap.get((r as any).restaurant_id);
    if (!rest) continue;

    const reviewSent = await sendReactEmail({
      to: email,
      subject: `How was your experience at ${rest.name}?`,
      react: ReviewRequestEmail({ appBaseUrl, restaurantName: rest.name, reservationId: (r as any).id }),
    });

    if (reviewSent.ok) {
      await supabase.from("reservation_notifications").insert({ reservation_id: (r as any).id, type: keyType });
      sentReviews += 1;
    }
  }

  return NextResponse.json({ ok: true, sentReminders, sentReviews, tomorrow, yesterday });
}

