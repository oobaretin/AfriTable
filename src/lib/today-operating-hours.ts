import { parseCatalogHoursToArray, type OperatingHour } from "@/lib/parse-catalog-hours";
import { formatTimeRange12h } from "@/lib/utils/time-format";

export type TodayHoursResult = {
  label: string;
  openNow: boolean;
  hasHours: boolean;
  /** True when the venue has no schedule for the current weekday. */
  closedToday: boolean;
};

const US_STATE_TIMEZONE: Record<string, string> = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  DC: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  IA: "America/Chicago",
  ID: "America/Boise",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  MA: "America/New_York",
  MD: "America/New_York",
  ME: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MO: "America/Chicago",
  MS: "America/Chicago",
  MT: "America/Denver",
  NC: "America/New_York",
  ND: "America/Chicago",
  NE: "America/Chicago",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NV: "America/Los_Angeles",
  NY: "America/New_York",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VA: "America/New_York",
  VT: "America/New_York",
  WA: "America/Los_Angeles",
  WI: "America/Chicago",
  WV: "America/New_York",
  WY: "America/Denver",
};

const WEEKDAY_TO_DOW: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const DEFAULT_US_TIMEZONE = "America/Chicago";

export function extractUsStateFromAddress(address: unknown): string | null {
  if (address && typeof address === "object" && "state" in address) {
    const state = String((address as { state?: string }).state || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{2}$/.test(state)) return state;
  }
  if (typeof address === "string") {
    const m = address.match(/,\s*([A-Z]{2})\s+\d{5}/);
    if (m) return m[1];
  }
  return null;
}

export function timezoneForUsState(state: string | null | undefined): string {
  if (!state) return DEFAULT_US_TIMEZONE;
  return US_STATE_TIMEZONE[state.toUpperCase()] ?? DEFAULT_US_TIMEZONE;
}

export function zonedDayAndTime(date: Date, timeZone: string): { dow: number; hhmm: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dow = WEEKDAY_TO_DOW[weekday] ?? date.getDay();

  return {
    dow,
    hhmm: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
  };
}

export function normalizeOperatingHoursList(input: unknown): OperatingHour[] {
  const fromCatalog = parseCatalogHoursToArray(input);
  if (fromCatalog.length) return fromCatalog;

  if (Array.isArray(input)) {
    return input
      .map((o: { day_of_week?: number; open_time?: string; close_time?: string }) => ({
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

  return [];
}

export function getTodayOperatingHours(
  operatingHours: unknown,
  options?: { address?: unknown; timeZone?: string; date?: Date },
): TodayHoursResult {
  const list = normalizeOperatingHoursList(operatingHours);
  const date = options?.date ?? new Date();
  const state = extractUsStateFromAddress(options?.address);
  const timeZone = options?.timeZone ?? timezoneForUsState(state);
  const { dow, hhmm: localNow } = zonedDayAndTime(date, timeZone);

  if (!list.length) {
    return { label: "Hours coming soon", openNow: false, hasHours: false, closedToday: true };
  }

  const rule = list.find((o) => o.day_of_week === dow);
  if (!rule) {
    return { label: "Closed today", openNow: false, hasHours: true, closedToday: true };
  }

  const open = String(rule.open_time ?? "");
  const close = String(rule.close_time ?? "");
  const openNow = open && close ? localNow >= open && localNow < close : false;

  return {
    label: formatTimeRange12h(open, close),
    openNow,
    hasHours: true,
    closedToday: false,
  };
}
