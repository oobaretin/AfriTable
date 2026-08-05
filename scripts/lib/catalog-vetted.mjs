/**
 * Vetted dine-in criteria (matches src/lib/catalog-trust.ts + catalog-qa report).
 */
import { hasVenuePhoto, photoOnlyStreetView } from "./catalog-photo-rank.mjs";

export function hasHours(h) {
  if (!h) return false;
  if (Array.isArray(h)) return h.length > 0;
  if (typeof h === "object") return Object.keys(h).length > 0;
  return typeof h === "string" && h.trim().length > 0;
}

export function hasAddress(addr) {
  return Boolean(addr && typeof addr === "string" && /,\s*[A-Z]{2}\b/.test(addr));
}

export function isVettedDineIn(r) {
  return (
    Boolean(String(r.phone || "").trim()) &&
    hasHours(r.hours) &&
    hasAddress(r.address) &&
    hasVenuePhoto(r.images) &&
    !photoOnlyStreetView(r.images)
  );
}

export function cityFromAddress(addr) {
  if (!addr || typeof addr !== "string") return "—";
  const parts = addr.split(",").map((s) => s.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

export function stateFromAddress(addr) {
  if (!addr || typeof addr !== "string") return "";
  const m = addr.match(/,\s*([A-Z]{2})(?:\s+\d{5})?\s*$/);
  return m?.[1] ?? "";
}

export function stateFromRecord(r) {
  if (r.state && /^[A-Z]{2}$/.test(String(r.state))) return String(r.state);
  return stateFromAddress(String(r.address || ""));
}
