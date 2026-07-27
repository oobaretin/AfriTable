import { format, parseISO } from "date-fns";

export type TableRequestAssistInput = {
  referenceCode: string;
  restaurantName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  preferredDate: string | null;
  timePreference: string;
  partySize: number;
  specialRequests: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
};

const TIME_LABELS: Record<string, string> = {
  morning: "Morning (before 12pm)",
  afternoon: "Afternoon (12pm – 5pm)",
  evening: "Evening (after 5pm)",
  flexible: "Flexible — any time",
};

export type ContactRecommendation = {
  primary: "phone" | "website" | "instagram";
  label: string;
  reason: string;
  href: string | null;
};

function formatPreferredDate(preferredDate: string | null): string {
  if (!preferredDate) return "a date they will confirm with you";
  return format(parseISO(preferredDate), "EEEE, MMMM d, yyyy");
}

function normalizeInstagramUrl(handleOrUrl: string): string {
  const raw = handleOrUrl.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const handle = raw.replace(/^@/, "").replace(/^instagram\.com\//, "").replace(/\/$/, "");
  return `https://www.instagram.com/${handle}/`;
}

function websiteHintsReservation(website: string): boolean {
  const lower = website.toLowerCase();
  return /opentable|resy|tock|sevenrooms|exploretock|yelp\.com\/reservations|reserve/.test(lower);
}

export function recommendContactMethod(input: Pick<TableRequestAssistInput, "phone" | "website" | "instagram">): ContactRecommendation {
  if (input.phone) {
    return {
      primary: "phone",
      label: "Call the restaurant",
      reason: "Phone is the most reliable way to reach independent restaurants (~99% of listings have a number).",
      href: `tel:${input.phone}`,
    };
  }

  if (input.website) {
    const hasOnlineBooking = websiteHintsReservation(input.website);
    return {
      primary: "website",
      label: hasOnlineBooking ? "Try their online booking link" : "Check their website",
      reason: hasOnlineBooking
        ? "This website may accept reservations online — still confirm with the guest afterward."
        : "No phone on file. Look for a contact or reservation page on their website.",
      href: input.website,
    };
  }

  if (input.instagram) {
    return {
      primary: "instagram",
      label: "Message on Instagram",
      reason: "No phone or website on file. DM is a slower fallback — set expectations with the guest.",
      href: normalizeInstagramUrl(input.instagram),
    };
  }

  return {
    primary: "website",
    label: "No contact on file",
    reason: "Open the public listing and use whatever contact info you can find.",
    href: null,
  };
}

export function buildCallScript(input: TableRequestAssistInput): string {
  const dateLabel = formatPreferredDate(input.preferredDate);
  const timeLabel = TIME_LABELS[input.timePreference] ?? input.timePreference;
  const notes = input.specialRequests?.trim();

  return [
    `Hi, I'm calling from AfriTable — we connect guests with African and Caribbean restaurants.`,
    ``,
    `A guest submitted a table request for ${input.restaurantName}:`,
    `• Guest name: ${input.guestName}`,
    `• Party size: ${input.partySize}`,
    `• Preferred date: ${dateLabel}`,
    `• Time preference: ${timeLabel}`,
    `• Guest phone (for restaurant to confirm): ${input.guestPhone}`,
    `• AfriTable reference: ${input.referenceCode}`,
    notes ? `• Notes: ${notes}` : null,
    ``,
    `Are you able to accommodate this party? If yes, please confirm directly with the guest at ${input.guestPhone}.`,
    `AfriTable is a directory — we don't take payment or guarantee the booking.`,
    ``,
    `Thank you!`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildGuestFollowUpConfirmed(input: TableRequestAssistInput): { subject: string; body: string } {
  const dateLabel = formatPreferredDate(input.preferredDate);
  const timeLabel = TIME_LABELS[input.timePreference] ?? input.timePreference;

  return {
    subject: `Your table request — ${input.restaurantName}`,
    body: [
      `Hi ${input.guestName.split(" ")[0] || input.guestName},`,
      ``,
      `Good news — we spoke with ${input.restaurantName} about your request.`,
      ``,
      `Please expect the restaurant to confirm with you directly:`,
      `• Date: ${dateLabel}`,
      `• Time preference: ${timeLabel}`,
      `• Party of ${input.partySize}`,
      ``,
      `Your reference: ${input.referenceCode}`,
      ``,
      `If you don't hear from them within 24 hours, call them at the number on our listing or reply to this email.`,
      ``,
      `— AfriTable`,
    ].join("\n"),
  };
}

export function buildGuestFollowUpDeclined(input: TableRequestAssistInput): { subject: string; body: string } {
  const dateLabel = formatPreferredDate(input.preferredDate);
  const timeLabel = TIME_LABELS[input.timePreference] ?? input.timePreference;

  return {
    subject: `Update on your table request — ${input.restaurantName}`,
    body: [
      `Hi ${input.guestName.split(" ")[0] || input.guestName},`,
      ``,
      `We contacted ${input.restaurantName} about your request for ${dateLabel} (${timeLabel}, party of ${input.partySize}).`,
      ``,
      `They weren't able to accommodate that visit — we suggest trying another date/time or browsing similar restaurants on AfriTable.`,
      ``,
      `Reference: ${input.referenceCode}`,
      ``,
      `— AfriTable`,
    ].join("\n"),
  };
}

export function buildQueueSummary(
  pending: Array<{
    restaurantName: string;
    preferredDate: string | null;
    timePreference: string;
    partySize: number;
    createdAt: string;
  }>,
): string | null {
  if (!pending.length) return null;

  const oldest = pending[pending.length - 1];
  const timeLabel = TIME_LABELS[oldest.timePreference] ?? oldest.timePreference;
  const datePart = oldest.preferredDate
    ? format(parseISO(oldest.preferredDate), "MMM d")
    : "flexible date";

  if (pending.length === 1) {
    return `1 request awaiting your call: ${oldest.restaurantName} · ${datePart} · ${timeLabel} · ${oldest.partySize} guests.`;
  }

  return `${pending.length} requests awaiting your call. Oldest: ${oldest.restaurantName} · ${datePart} · ${timeLabel} · ${oldest.partySize} guests.`;
}

export function buildTableRequestAssist(input: TableRequestAssistInput) {
  return {
    contact: recommendContactMethod(input),
    callScript: buildCallScript(input),
    guestConfirmed: buildGuestFollowUpConfirmed(input),
    guestDeclined: buildGuestFollowUpDeclined(input),
  };
}
