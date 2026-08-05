export type PartnerOutreachCandidate = {
  slug: string;
  name: string;
  cuisine: string;
  rating: number;
  address: string;
  city: string;
  state: string;
  phone: string;
  website: string | null;
  claim_url: string;
  detail_url: string;
  priority: "primary" | "secondary";
  /** @deprecated Use state — kept for older JSON exports */
  metro?: string;
};

export type PartnerOutreachContactChannel = {
  label: string;
  href: string;
  kind: "phone" | "website" | "instagram" | "facebook";
};

export type PartnerOutreachEmail = {
  subject: string;
  body: string;
  followUp: { subject: string; body: string };
  channel: PartnerOutreachContactChannel;
  sendOrder: number;
};

export type PartnerOutreachStatusValue =
  | "pending"
  | "sent"
  | "replied"
  | "claimed"
  | "declined"
  | "skipped";

export type PartnerOutreachStatusRow = {
  slug: string;
  status: PartnerOutreachStatusValue;
  notes: string | null;
  contacted_at: string | null;
  updated_at: string;
  updated_by: string | null;
};

export const PARTNER_OUTREACH_STATUS_LABELS: Record<PartnerOutreachStatusValue, string> = {
  pending: "Pending",
  sent: "Sent",
  replied: "Replied",
  claimed: "Claimed",
  declined: "Declined",
  skipped: "Skipped",
};

export const PARTNER_OUTREACH_STATUS_FILTERS: Array<PartnerOutreachStatusValue | "all"> = [
  "all",
  "pending",
  "sent",
  "replied",
  "claimed",
  "declined",
  "skipped",
];
