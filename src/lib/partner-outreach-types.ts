export type PartnerOutreachCandidate = {
  metro: string;
  slug: string;
  name: string;
  cuisine: string;
  rating: number;
  address: string;
  phone: string;
  website: string | null;
  claim_url: string;
  detail_url: string;
  priority: "primary" | "secondary";
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
