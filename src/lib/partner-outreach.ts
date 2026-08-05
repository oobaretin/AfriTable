import "server-only";

import * as fs from "node:fs";
import * as path from "node:path";
import { SITE_CONTACT } from "@/lib/site-contact";
import type {
  PartnerOutreachCandidate,
  PartnerOutreachContactChannel,
  PartnerOutreachEmail,
} from "@/lib/partner-outreach-types";

export type { PartnerOutreachCandidate, PartnerOutreachContactChannel, PartnerOutreachEmail };

type OutreachFile = {
  candidates: PartnerOutreachCandidate[];
  states?: Array<{ state: string; count: number }>;
};

const DATA_PATH = path.join(process.cwd(), "data", "partner-outreach-candidates.json");

const PAGE_SIZE = 25;

/** Houston slugs with hand-tuned copy (optional overrides). */
const CUSTOM_HOOKS: Record<string, (c: PartnerOutreachCandidate) => string> = {
  "grill-master-african-restaurant-houston": (c) =>
    `Your spot at ${streetLine(c.address)} is already listed on our directory with strong reviews — we'd love to help you turn that visibility into actual reservations.`,
  "vertex-houston": (c) =>
    `Vertex is already featured in our Houston directory with excellent reviews for Ethiopian dining at ${streetLine(c.address)}.`,
  "glozi-calabar-restaurant-and-african-cuisine-houston": (c) =>
    `Your Westheimer location (${streetLine(c.address)}) is already live in our directory with a ${c.rating.toFixed(1)} rating.`,
  "dakar-street-food-blodgett-houston": (c) =>
    `Dakar Street Food @ Blodgett is already in our Houston directory with a ${c.rating.toFixed(1)} rating — Third Ward diners are exactly who we built AfriTable for.`,
  "chopnblok-downtown-houston": (c) =>
    `Your downtown location at ${streetLine(c.address)} is already listed with strong reviews. For a fast-fine concept like ChòpnBlọk, direct reservations matter.`,
};

const CUSTOM_SUBJECTS: Record<string, string> = {
  "grill-master-african-restaurant-houston": "Your Grill Master listing on AfriTable — claim it for online bookings",
  "vertex-houston": "Vertex is on AfriTable — claim your Ethiopian listing for online bookings",
  "glozi-calabar-restaurant-and-african-cuisine-houston":
    "Glozi Calabar on AfriTable — free listing claim + online reservations",
  "dakar-street-food-blodgett-houston": "Dakar Street Food — your AfriTable listing is ready to claim",
  "chopnblok-downtown-houston": "ChòpnBlọk downtown — claim your AfriTable listing for reservations",
};

function teamGreeting(name: string): string {
  const base = name.replace(/\s+@.+$/i, "").replace(/\.$/, "").trim();
  return `Hi ${base} team`;
}

function streetLine(address: string): string {
  return address.split(",")[0]?.trim() || address;
}

function locationLabel(c: PartnerOutreachCandidate): string {
  if (c.city && c.state) return `${c.city}, ${c.state}`;
  if (c.state) return c.state;
  return "your area";
}

function hookForCandidate(c: PartnerOutreachCandidate): string {
  const custom = CUSTOM_HOOKS[c.slug];
  if (custom) return custom(c);
  const cuisineSuffix = c.cuisine && c.cuisine !== "African" ? ` for ${c.cuisine} dining` : "";
  return `${c.name} is already listed in our ${locationLabel(c)} directory${cuisineSuffix} with a ${c.rating.toFixed(1)} rating at ${streetLine(c.address)}.`;
}

function subjectForCandidate(c: PartnerOutreachCandidate): string {
  return (
    CUSTOM_SUBJECTS[c.slug] ??
    `${c.name} on AfriTable — claim your listing for online bookings`
  );
}

export function resolveOutreachChannel(c: PartnerOutreachCandidate): PartnerOutreachContactChannel {
  const web = String(c.website || "").trim();
  if (/instagram\.com/i.test(web)) {
    return { label: "Instagram", href: web, kind: "instagram" };
  }
  if (/facebook\.com/i.test(web)) {
    return { label: "Facebook", href: web, kind: "facebook" };
  }
  if (web) {
    return { label: "Website", href: web, kind: "website" };
  }
  const tel = c.phone.replace(/\D/g, "");
  return { label: "Phone", href: `tel:+1${tel}`, kind: "phone" };
}

export function buildPartnerOutreachEmail(
  c: PartnerOutreachCandidate,
  senderName = "AfriTable Partnerships",
): PartnerOutreachEmail {
  const greeting = teamGreeting(c.name);
  const hook = hookForCandidate(c);
  const region = c.state ? `${c.state} partners` : "restaurant partners";

  const body = `${greeting},

I'm reaching out from AfriTable, a platform built specifically for African and Caribbean dine-in restaurants. ${hook}

Your current listing:
${c.detail_url}

If you're the owner or manager, you can claim your listing and unlock your partner dashboard to manage hours, photos, and online reservations:
${c.claim_url}

What partners get:
- A verified "Book online" badge on your listing (vs. request-only for unclaimed spots)
- A dashboard to update your menu, hours, and photos
- Reservation requests routed directly to you

We're onboarding ${region} now and would love ${c.name.replace(/\.$/, "")} to be among the first live for booking. Reply here or call ${c.phone} if you'd prefer a quick walkthrough.

Best,
${senderName}
Partnerships, AfriTable
${SITE_CONTACT.partnerships}
https://afritable.com`;

  const followUp = {
    subject: `Following up — ${c.name} on AfriTable`,
    body: `${greeting},

Just following up on your AfriTable listing. Claim here when you're ready:
${c.claim_url}

Happy to help with a 10-minute setup — reply or call ${c.phone}.

Best,
${senderName}
${SITE_CONTACT.partnerships}`,
  };

  return {
    subject: subjectForCandidate(c),
    body,
    followUp,
    channel: resolveOutreachChannel(c),
    sendOrder: c.priority === "primary" ? 0 : 1,
  };
}

function normalizeCandidate(raw: PartnerOutreachCandidate): PartnerOutreachCandidate {
  const state = raw.state || legacyMetroToState(raw.metro) || "";
  const city = raw.city || "—";
  return { ...raw, state, city };
}

function legacyMetroToState(metro?: string): string {
  const map: Record<string, string> = {
    houston: "TX",
    boston: "MA",
    denver: "CO",
    atlanta: "GA",
    minneapolis: "MN",
  };
  return metro ? map[metro] ?? "" : "";
}

export function loadPartnerOutreachCandidates(): PartnerOutreachCandidate[] {
  if (!fs.existsSync(DATA_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) as OutreachFile;
  return (raw.candidates ?? []).map(normalizeCandidate);
}

export function loadPartnerOutreachStateCounts(): Array<{ state: string; count: number }> {
  if (!fs.existsSync(DATA_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) as OutreachFile;
  if (raw.states?.length) return raw.states;
  const counts = new Map<string, number>();
  for (const c of loadPartnerOutreachCandidates()) {
    if (c.state) counts.set(c.state, (counts.get(c.state) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([state, count]) => ({ state, count }));
}

export type PartnerOutreachQuery = {
  state?: string;
  city?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export function filterPartnerOutreachCandidates(
  candidates: PartnerOutreachCandidate[],
  query: PartnerOutreachQuery,
): PartnerOutreachCandidate[] {
  let list = candidates;
  const state = query.state?.trim().toUpperCase();
  if (state && state !== "ALL") {
    list = list.filter((c) => c.state === state);
  }
  const city = query.city?.trim().toLowerCase();
  if (city) {
    list = list.filter((c) => c.city.toLowerCase().includes(city));
  }
  const q = query.q?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }
  return list;
}

export function paginatePartnerOutreachCandidates(
  candidates: PartnerOutreachCandidate[],
  page = 1,
  limit = PAGE_SIZE,
): { items: PartnerOutreachCandidate[]; total: number; page: number; pageCount: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const total = candidates.length;
  const pageCount = Math.max(1, Math.ceil(total / safeLimit));
  const offset = (safePage - 1) * safeLimit;
  return {
    items: candidates.slice(offset, offset + safeLimit),
    total,
    page: safePage,
    pageCount,
  };
}

export const PARTNER_OUTREACH_PAGE_SIZE = PAGE_SIZE;

/** @deprecated Use filterPartnerOutreachCandidates with state */
export function getPartnerOutreachByMetro(metro?: string): PartnerOutreachCandidate[] {
  const map: Record<string, string> = {
    houston: "TX",
    boston: "MA",
    denver: "CO",
    atlanta: "GA",
    minneapolis: "MN",
  };
  const state = metro ? map[metro] : undefined;
  return filterPartnerOutreachCandidates(loadPartnerOutreachCandidates(), { state });
}

/** @deprecated Use loadPartnerOutreachStateCounts */
export function listPartnerOutreachMetros(): string[] {
  return ["houston", "boston", "denver", "atlanta", "minneapolis"];
}

export function metroLabel(metro: string): string {
  const labels: Record<string, string> = {
    houston: "Houston",
    boston: "Boston",
    denver: "Denver",
    atlanta: "Atlanta",
    minneapolis: "Minneapolis",
  };
  return labels[metro] ?? metro;
}
