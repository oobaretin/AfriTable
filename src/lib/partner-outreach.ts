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
};

const DATA_PATH = path.join(process.cwd(), "data", "partner-outreach-candidates.json");

const METRO_LABELS: Record<string, string> = {
  houston: "Houston",
  boston: "Boston",
  denver: "Denver",
  atlanta: "Atlanta",
  minneapolis: "Minneapolis",
};

/** Houston send priority (lower = send first). */
const HOUSTON_SEND_ORDER: Record<string, number> = {
  "grill-master-african-restaurant-houston": 1,
  "chopnblok-downtown-houston": 2,
  "glozi-calabar-restaurant-and-african-cuisine-houston": 3,
  "dakar-street-food-blodgett-houston": 4,
  "vertex-houston": 5,
};

function teamGreeting(name: string): string {
  const base = name.replace(/\s+@.+$/i, "").replace(/\.$/, "").trim();
  return `Hi ${base} team`;
}

function streetLine(address: string): string {
  return address.split(",")[0]?.trim() || address;
}

function hookForCandidate(c: PartnerOutreachCandidate): string {
  const hooks: Record<string, string> = {
    "grill-master-african-restaurant-houston":
      `Your spot at **${streetLine(c.address)}** is already listed on our directory with strong reviews — we'd love to help you turn that visibility into actual reservations.`,
    "vertex-houston":
      `**Vertex** is already featured in our Houston directory with excellent reviews for Ethiopian dining at **${streetLine(c.address)}**.`,
    "glozi-calabar-restaurant-and-african-cuisine-houston":
      `Your Westheimer location (**${streetLine(c.address)}**) is already live in our directory with a **${c.rating.toFixed(1)}** rating.`,
    "dakar-street-food-blodgett-houston":
      `**Dakar Street Food @ Blodgett** is already in our Houston directory with a **${c.rating.toFixed(1)}** rating — and Third Ward diners are exactly who we built AfriTable for.`,
    "chopnblok-downtown-houston":
      `Your downtown location at **${streetLine(c.address)}** is already listed with strong reviews. For a fast-fine concept like ChòpnBlọk, direct reservations matter.`,
  };
  return (
    hooks[c.slug] ??
    `**${c.name}** is already listed in our ${METRO_LABELS[c.metro] ?? c.metro} directory with a **${c.rating.toFixed(1)}** rating at **${streetLine(c.address)}**.`
  );
}

function subjectForCandidate(c: PartnerOutreachCandidate): string {
  const subjects: Record<string, string> = {
    "grill-master-african-restaurant-houston": "Your Grill Master listing on AfriTable — claim it for online bookings",
    "vertex-houston": "Vertex is on AfriTable — claim your Ethiopian listing for online bookings",
    "glozi-calabar-restaurant-and-african-cuisine-houston":
      "Glozi Calabar on AfriTable — free listing claim + online reservations",
    "dakar-street-food-blodgett-houston": "Dakar Street Food — your AfriTable listing is ready to claim",
    "chopnblok-downtown-houston": "ChòpnBlọk downtown — claim your AfriTable listing for reservations",
  };
  return subjects[c.slug] ?? `${c.name} on AfriTable — claim your listing for online bookings`;
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
  const hook = hookForCandidate(c).replace(/\*\*/g, "");

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

We're onboarding ${METRO_LABELS[c.metro] ?? c.metro} partners now and would love ${c.name.replace(/\.$/, "")} to be among the first live for booking. Reply here or call ${c.phone} if you'd prefer a quick walkthrough.

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
    sendOrder: HOUSTON_SEND_ORDER[c.slug] ?? (c.priority === "primary" ? 0 : 99),
  };
}

export function loadPartnerOutreachCandidates(): PartnerOutreachCandidate[] {
  if (!fs.existsSync(DATA_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) as OutreachFile;
  return raw.candidates ?? [];
}

export function getPartnerOutreachByMetro(metro?: string): PartnerOutreachCandidate[] {
  const all = loadPartnerOutreachCandidates();
  if (!metro) return all;
  return all.filter((c) => c.metro === metro);
}

export function metroLabel(metro: string): string {
  return METRO_LABELS[metro] ?? metro;
}

export function listPartnerOutreachMetros(): string[] {
  const metros = new Set(loadPartnerOutreachCandidates().map((c) => c.metro));
  return [...metros].sort();
}
