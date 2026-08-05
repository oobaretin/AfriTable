import type { LivePartnerStatus } from "@/lib/restaurant-partner-status";

/**
 * Guest-facing booking modes — binary and honest.
 * - book: claimed partner with online reservations
 * - request: directory listing; AfriTable forwards a table request
 * - call: has a phone but should call first (claimed with reservations off, or request disabled)
 */
export type BookingMode = "book" | "request" | "call";

export type BookingAction = {
  mode: BookingMode;
  label: string;
  shortLabel: string;
  ctaLabel: string;
  description: string;
};

export function resolveBookingAction(
  status: Pick<LivePartnerStatus, "isLivePartner" | "isClaimed" | "onlineReservationsEnabled">,
  options?: { phone?: string | null },
): BookingAction {
  if (status.isLivePartner) {
    return {
      mode: "book",
      label: "Book on AfriTable",
      shortLabel: "Book online",
      ctaLabel: "Book a table →",
      description: "Instant availability from this AfriTable partner.",
    };
  }

  if (status.isClaimed && !status.onlineReservationsEnabled && options?.phone) {
    return {
      mode: "call",
      label: "Call to book",
      shortLabel: "Call to book",
      ctaLabel: "Call to book →",
      description: "This partner manages tables by phone — call to reserve.",
    };
  }

  if (options?.phone && !status.isClaimed) {
    return {
      mode: "request",
      label: "Request a table",
      shortLabel: "Request a table",
      ctaLabel: "Plan a visit →",
      description: "Directory listing — call them, or send a preferred date and we’ll forward your request.",
    };
  }

  if (options?.phone) {
    return {
      mode: "call",
      label: "Call to book",
      shortLabel: "Call to book",
      ctaLabel: "Call to book →",
      description: "Call the restaurant to reserve a table.",
    };
  }

  return {
    mode: "request",
    label: "Request a table",
    shortLabel: "Request a table",
    ctaLabel: "Plan a visit →",
    description: "Directory listing — send a preferred date and we’ll forward your request.",
  };
}

/** Default for catalog JSON cards when partner status is unknown (most listings). */
export const DEFAULT_CATALOG_BOOKING_ACTION: BookingAction = {
  mode: "request",
  label: "Request a table",
  shortLabel: "Request a table",
  ctaLabel: "Plan a visit →",
  description: "Directory listing — call them, or send a preferred date and we’ll forward your request.",
};

export { isWeakSpecialty } from "@/lib/catalog-trust";
