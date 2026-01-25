import { addMinutes, format } from "date-fns";

export function buildCalendarLinks(params: {
  title: string;
  description: string;
  location: string;
  start: Date;
  durationMinutes: number;
}) {
  const end = addMinutes(params.start, params.durationMinutes);

  const dtStart = format(params.start, "yyyyMMdd'T'HHmmss");
  const dtEnd = format(end, "yyyyMMdd'T'HHmmss");

  const text = params.title;
  const details = params.description;
  const location = params.location;

  // Google Calendar (local time; user’s timezone)
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    text,
  )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${dtStart}/${dtEnd}`;

  // Outlook.com
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    text,
  )}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&startdt=${encodeURIComponent(
    params.start.toISOString(),
  )}&enddt=${encodeURIComponent(end.toISOString())}`;

  return { google, outlook };
}

export function buildICS(params: {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  durationMinutes: number;
}) {
  const end = addMinutes(params.start, params.durationMinutes);

  // Use UTC in ICS for best compatibility
  const dtStart = format(params.start, "yyyyMMdd'T'HHmmss'Z'");
  const dtEnd = format(end, "yyyyMMdd'T'HHmmss'Z'");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AfriTable//Reservations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(params.title)}`,
    `DESCRIPTION:${escapeICS(params.description)}`,
    `LOCATION:${escapeICS(params.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

function escapeICS(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

