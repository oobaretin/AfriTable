import {
  hasVenuePhoto,
  photoOnlyStreetView,
} from "@/lib/restaurant-image";

/**
 * Catalog trust for guest-facing UI.
 * "Vetted dine-in" means the listing passed AfriTable curation scope and has
 * enough contact/media signals — not that we called to confirm open tonight.
 */

const WEAK_SPECIALTY_RE = /call for seasonal|coming soon|seasonal specials only/i;

const TEMPLATED_ABOUT_RE =
  /^Authentic .+ restaurant in .+\. Experience traditional .+ flavors and hospitality at/i;

const WEAK_ABOUT_RE =
  /serves african flavors to diners in .+ and surrounding communities|neighborhood spot for african plates|a neighborhood spot for/i;

const WEAK_STORY_RE =
  /serves african flavors to diners in .+ and surrounding communities/i;

export type CatalogTrustLevel = "vetted" | "listed";

export type CatalogTrustSignals = {
  level: CatalogTrustLevel;
  label: string;
  shortLabel: string;
  hasPhone: boolean;
  hasHours: boolean;
  hasWebsite: boolean;
  hasVenuePhoto: boolean;
  photoOnlyStreetView: boolean;
  weakCopy: boolean;
  score: number;
};

export type CatalogTrustInput = {
  phone?: string | null;
  website?: string | null;
  hours?: unknown;
  images?: string[] | null;
  about?: string | null;
  our_story?: string | null;
  specialty?: string | null;
  menu_highlights?: string[] | null;
  address?: unknown;
  google_place_id?: string | null;
};

export function isWeakSpecialty(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  return WEAK_SPECIALTY_RE.test(value);
}

export function isWeakAbout(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  const t = value.trim();
  return TEMPLATED_ABOUT_RE.test(t) || WEAK_ABOUT_RE.test(t);
}

export function isWeakStory(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  return WEAK_STORY_RE.test(value.trim());
}

function hasHoursSignal(hours: unknown): boolean {
  if (!hours) return false;
  if (Array.isArray(hours) && hours.length > 0) return true;
  if (typeof hours === "object") {
    return Object.keys(hours as object).length > 0;
  }
  if (typeof hours === "string") return hours.trim().length > 0;
  return false;
}

function hasAddressSignal(address: unknown): boolean {
  if (!address) return false;
  if (typeof address === "string") {
    return /,\s*[A-Z]{2}\b/.test(address) && address.trim().length >= 12;
  }
  if (typeof address === "object") {
    const a = address as { street?: string; city?: string };
    return Boolean(a.street && a.city);
  }
  return false;
}

function specialtySignal(input: CatalogTrustInput): string | null {
  const candidates = [input.specialty, ...(input.menu_highlights ?? [])].filter(Boolean) as string[];
  for (const c of candidates) {
    if (!isWeakSpecialty(c)) return c;
  }
  return null;
}

/** Compute guest-facing trust level for a catalog or detail listing. */
export function evaluateCatalogTrust(input: CatalogTrustInput): CatalogTrustSignals {
  const hasPhone = Boolean(String(input.phone || "").trim());
  const hasWebsite = Boolean(String(input.website || "").trim());
  const hasHours = hasHoursSignal(input.hours);
  const hasAddr = hasAddressSignal(input.address);
  const venuePhoto = hasVenuePhoto(input.images);
  const onlySv = photoOnlyStreetView(input.images);
  const weakCopy =
    isWeakAbout(input.about) && isWeakStory(input.our_story) && !specialtySignal(input);

  let score = 0;
  if (hasPhone) score += 2;
  if (hasHours) score += 2;
  if (hasAddr) score += 2;
  if (venuePhoto) score += 3;
  if (hasWebsite) score += 1;
  if (specialtySignal(input)) score += 1;
  if (input.google_place_id) score += 1;
  if (onlySv) score -= 2;
  if (weakCopy) score -= 1;

  const vetted = hasPhone && hasHours && hasAddr && venuePhoto && !onlySv;

  return {
    level: vetted ? "vetted" : "listed",
    label: vetted ? "Vetted dine-in" : "Directory listing",
    shortLabel: vetted ? "Vetted" : "Listed",
    hasPhone,
    hasHours,
    hasWebsite,
    hasVenuePhoto: venuePhoto,
    photoOnlyStreetView: onlySv,
    weakCopy,
    score,
  };
}

/** Prefer non-weak about text; return null when copy would erode trust. */
export function resolveGuestAbout(
  about: string | null | undefined,
  fallbackCity?: string | null,
): string | null {
  if (about && !isWeakAbout(about)) return about.trim();
  if (fallbackCity) {
    return `Sit-down African and Caribbean dining in ${fallbackCity}.`;
  }
  return null;
}

export function resolveGuestSpecialty(
  specialty?: string | null,
  menuHighlights?: string[] | null,
): string | null {
  if (specialty && !isWeakSpecialty(specialty)) return specialty;
  for (const h of menuHighlights ?? []) {
    if (h && !isWeakSpecialty(h)) return h;
  }
  return null;
}
