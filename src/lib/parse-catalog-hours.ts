export type OperatingHour = {
  day_of_week: number;
  open_time: string;
  close_time: string;
};

const DAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

/** Placeholder strings from SerpAPI merge — not displayable until normalized. */
export function isPlaceholderHours(hours: unknown): boolean {
  if (!hours || typeof hours !== "object") return true;
  const s = JSON.stringify(hours).toLowerCase();
  return s.includes("(confirm)") || s.includes('"varies"') || s.includes("coming soon");
}

export function toHHmm(timeStr: string): string | null {
  const raw = String(timeStr || "").trim();
  if (!raw) return null;
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2] || "0", 10);
  const period = match[3]?.toLowerCase();

  if (period === "pm" && hour !== 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  if (!period && hour <= 23) {
    // 24-hour style (e.g. "22:00")
  } else if (!period) {
    return null;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Parse a single catalog value like "11:00 AM - 9:00 PM" or "11:00 - 22:00 (confirm)". */
export function parseTimeRange(value: string): { open: string; close: string } | null {
  const cleaned = String(value || "")
    .replace(/\(confirm\)/gi, "")
    .trim();
  if (!cleaned || /^(closed|varies|unknown|n\/a|tbd)$/i.test(cleaned)) return null;

  const amPm = cleaned.match(
    /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[-–—to]+\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i,
  );
  if (amPm) {
    const open = toHHmm(`${amPm[1]}:${amPm[2] || "00"} ${amPm[3]}`);
    const close = toHHmm(`${amPm[4]}:${amPm[5] || "00"} ${amPm[6]}`);
    if (open && close) return { open, close };
  }

  const h24 = cleaned.match(/(\d{1,2}):(\d{2})\s*[-–—to]+\s*(\d{1,2}):(\d{2})/);
  if (h24) {
    const open = toHHmm(`${h24[1]}:${h24[2]}`);
    const close = toHHmm(`${h24[3]}:${h24[4]}`);
    if (open && close) return { open, close };
  }

  return null;
}

function daysInRange(startIdx: number, endIdx: number): number[] {
  const out: number[] = [];
  if (startIdx <= endIdx) {
    for (let i = startIdx; i <= endIdx; i++) out.push(i);
  } else {
    for (let i = startIdx; i <= 6; i++) out.push(i);
    for (let i = 0; i <= endIdx; i++) out.push(i);
  }
  return out;
}

/** Catalog object `{ mon_sat: "11:00 AM - 9:00 PM", sun: "Closed" }` → DB array. */
export function parseCatalogHoursToArray(hoursInput: unknown): OperatingHour[] {
  if (!hoursInput || typeof hoursInput !== "object") return [];

  if (Array.isArray(hoursInput)) {
    return hoursInput
      .map((o: any) => ({
        day_of_week: Number(o?.day_of_week),
        open_time: String(o?.open_time ?? ""),
        close_time: String(o?.close_time ?? ""),
      }))
      .filter(
        (o) =>
          Number.isFinite(o.day_of_week) &&
          o.day_of_week >= 0 &&
          o.day_of_week <= 6 &&
          /^\d{2}:\d{2}$/.test(o.open_time) &&
          /^\d{2}:\d{2}$/.test(o.close_time),
      );
  }

  const hoursObj = hoursInput as Record<string, string>;
  const byDay = new Map<number, OperatingHour>();

  for (const [key, value] of Object.entries(hoursObj)) {
    if (!value || /^closed$/i.test(String(value).trim())) continue;

    const rangeMatch = key.match(/^(\w+)_(\w+)$/);
    const times = parseTimeRange(String(value));
    if (!times) continue;

    if (rangeMatch) {
      const startIdx = DAY_MAP[rangeMatch[1].toLowerCase()];
      const endIdx = DAY_MAP[rangeMatch[2].toLowerCase()];
      if (startIdx === undefined || endIdx === undefined) continue;
      for (const day of daysInRange(startIdx, endIdx)) {
        byDay.set(day, { day_of_week: day, open_time: times.open, close_time: times.close });
      }
    } else {
      const day = DAY_MAP[key.toLowerCase()];
      if (day === undefined) continue;
      byDay.set(day, { day_of_week: day, open_time: times.open, close_time: times.close });
    }
  }

  return [...byDay.values()].sort((a, b) => a.day_of_week - b.day_of_week);
}

/** Convert 24h "11:00" to display "11:00 AM" for catalog JSON. */
function to12hLabel(hhmm: string): string {
  const [hStr, m] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

/** Normalize placeholder catalog hours to clean strings (no "(confirm)" / "Varies"). */
export function normalizeCatalogHoursObject(
  hoursInput: unknown,
  fallback: Record<string, string> = { mon_sat: "11:00 AM - 9:00 PM", sun: "12:00 PM - 8:00 PM" },
): Record<string, string> {
  const arr = parseCatalogHoursToArray(hoursInput);
  if (!arr.length) return { ...fallback };

  const sun = arr.find((h) => h.day_of_week === 0);
  const weekdays = arr.filter((h) => h.day_of_week >= 1 && h.day_of_week <= 6);

  const sameWeekday =
    weekdays.length > 0 &&
    weekdays.every(
      (h) => h.open_time === weekdays[0].open_time && h.close_time === weekdays[0].close_time,
    );

  const out: Record<string, string> = {};

  if (sameWeekday && weekdays.length === 6) {
    out.mon_sat = `${to12hLabel(weekdays[0].open_time)} - ${to12hLabel(weekdays[0].close_time)}`;
  } else if (weekdays.length) {
    const groups: Array<{ start: number; end: number; open: string; close: string }> = [];
    for (const h of weekdays) {
      const last = groups[groups.length - 1];
      if (last && last.end === h.day_of_week - 1 && last.open === h.open_time && last.close === h.close_time) {
        last.end = h.day_of_week;
      } else {
        groups.push({ start: h.day_of_week, end: h.day_of_week, open: h.open_time, close: h.close_time });
      }
    }
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    for (const g of groups) {
      const key = g.start === g.end ? dayNames[g.start] : `${dayNames[g.start]}_${dayNames[g.end]}`;
      out[key] = `${to12hLabel(g.open)} - ${to12hLabel(g.close)}`;
    }
  }

  if (sun) {
    out.sun = `${to12hLabel(sun.open_time)} - ${to12hLabel(sun.close_time)}`;
  } else {
    out.sun = "Closed";
  }

  return Object.keys(out).length ? out : { ...fallback };
}
