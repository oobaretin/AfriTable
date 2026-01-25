import { buildICS } from "@/lib/email/calendar";

export function buildReservationEmail(params: {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone?: string | null;
  reservationId: string;
  confirmationCode: string;
  date: string;
  time: string;
  partySize: number;
  guestName: string;
  specialRequests?: string | null;
}) {
  const subject = `Reservation confirmed: ${params.restaurantName}`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height:1.5">
      <h2 style="margin:0 0 12px">Reservation Confirmed!</h2>
      <p style="margin:0 0 16px">Hi ${escapeHtml(params.guestName)}, your table is booked.</p>
      <div style="border:1px solid #e5e7eb; border-radius:12px; padding:16px; max-width:560px">
        <div style="font-weight:600; font-size:16px; margin-bottom:8px">${escapeHtml(params.restaurantName)}</div>
        <div style="color:#374151; font-size:14px">${escapeHtml(params.restaurantAddress)}</div>
        ${params.restaurantPhone ? `<div style="color:#374151; font-size:14px">${escapeHtml(params.restaurantPhone)}</div>` : ""}
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0" />
        <div style="display:grid; grid-template-columns:140px 1fr; gap:6px; font-size:14px">
          <div style="color:#6b7280">Confirmation</div><div><b>${escapeHtml(params.confirmationCode)}</b></div>
          <div style="color:#6b7280">Date</div><div>${escapeHtml(params.date)}</div>
          <div style="color:#6b7280">Time</div><div>${escapeHtml(params.time)}</div>
          <div style="color:#6b7280">Party size</div><div>${params.partySize}</div>
          ${params.specialRequests ? `<div style="color:#6b7280">Requests</div><div>${escapeHtml(params.specialRequests)}</div>` : ""}
        </div>
      </div>
      <p style="margin:16px 0 0; color:#6b7280; font-size:13px">
        Sent by AfriTable. If you didn’t make this reservation, you can ignore this email.
      </p>
    </div>
  `;

  const start = new Date(`${params.date}T${params.time}:00Z`);
  const ics = buildICS({
    uid: params.reservationId,
    title: `AfriTable: ${params.restaurantName}`,
    description: `Reservation for ${params.partySize} at ${params.restaurantName}. Confirmation: ${params.confirmationCode}`,
    location: params.restaurantAddress,
    start,
    durationMinutes: 90,
  });

  return { subject, html, ics };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

