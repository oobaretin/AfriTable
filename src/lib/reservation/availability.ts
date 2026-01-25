import { addMinutes, format, set } from "date-fns";

export type OperatingHour = {
  day_of_week: number; // 0 (Sun) - 6 (Sat)
  open_time: string; // "HH:mm"
  close_time: string; // "HH:mm"
};

export type AvailabilitySlot = {
  time: string; // "HH:mm"
  availableTables: number;
  status: "available" | "limited" | "unavailable";
};

function parseHHmm(time: string) {
  const [hh, mm] = time.split(":").map((x) => Number(x));
  return { hh: Number.isFinite(hh) ? hh : 0, mm: Number.isFinite(mm) ? mm : 0 };
}

/**
 * Calculates time slots at 30-min intervals within operating hours, and estimates
 * table availability based on total eligible table count minus reservation count per slot.
 *
 * Note: Since reservations don't store a specific table assignment, this is a best-effort estimate.
 */
export function calculateAvailableTimeSlots(params: {
  date: Date;
  operatingHours: OperatingHour[];
  slotDurationMinutes: number;
  eligibleTableCount: number;
  reservationCountsByTime: Record<string, number>; // "HH:mm" -> count
}): AvailabilitySlot[] {
  const { date, operatingHours, slotDurationMinutes, eligibleTableCount, reservationCountsByTime } = params;

  const day = date.getDay(); // 0..6
  const rule = operatingHours.find((o) => o.day_of_week === day);
  if (!rule) return [];

  const open = parseHHmm(rule.open_time);
  const close = parseHHmm(rule.close_time);

  let cursor = set(date, { hours: open.hh, minutes: open.mm, seconds: 0, milliseconds: 0 });
  const end = set(date, { hours: close.hh, minutes: close.mm, seconds: 0, milliseconds: 0 });

  const slots: AvailabilitySlot[] = [];
  while (addMinutes(cursor, slotDurationMinutes) <= end) {
    const label = format(cursor, "HH:mm");
    const reserved = reservationCountsByTime[label] ?? 0;
    const remaining = Math.max(0, eligibleTableCount - reserved);
    const status: AvailabilitySlot["status"] =
      remaining <= 0 ? "unavailable" : remaining <= 2 ? "limited" : "available";

    slots.push({ time: label, availableTables: remaining, status });
    cursor = addMinutes(cursor, 30);
  }

  return slots;
}

