/**
 * Converts 24-hour time format (HH:mm) to 12-hour format with AM/PM
 * @param hhmm - Time string in format "HH:mm" (e.g., "14:30", "09:00")
 * @returns Time string in 12-hour format (e.g., "2:30 PM", "9:00 AM")
 */
export function formatTime12h(hhmm: string): string {
  if (!hhmm || typeof hhmm !== "string") return hhmm;
  
  const [hhRaw, mmRaw] = hhmm.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return hhmm;
  
  const period = hh >= 12 ? "PM" : "AM";
  const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  const minutes = String(mm).padStart(2, "0");
  
  return `${hour12}:${minutes} ${period}`;
}

/**
 * Formats a time range from 24-hour to 12-hour format
 * @param open - Opening time in "HH:mm" format
 * @param close - Closing time in "HH:mm" format
 * @param separator - Separator between times (default: "–")
 * @returns Formatted time range (e.g., "9:00 AM – 10:00 PM")
 */
export function formatTimeRange12h(open: string, close: string, separator: string = "–"): string {
  if (!open || !close) return `${open || ""}${separator}${close || ""}`;
  return `${formatTime12h(open)} ${separator} ${formatTime12h(close)}`;
}
