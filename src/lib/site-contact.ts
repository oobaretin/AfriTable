/**
 * Public @afri-table.com contact addresses (shown in UI and mailto links only).
 * Forwarded via Cloudflare Email Routing. Server delivery uses SITE_INBOX_EMAIL / SMTP env.
 */
export const SITE_CONTACT = {
  hello: "hello@afri-table.com",
  partners: "partners@afri-table.com",
  partnerships: "partnerships@afri-table.com",
  support: "support@afri-table.com",
  sales: "sales@afri-table.com",
  privacy: "privacy@afri-table.com",
  /** Default server notification To: if SITE_INBOX_EMAIL is unset; not shown on marketing pages. */
  contact: "contact@afri-table.com",
} as const;

export function mailto(email: string): string {
  return `mailto:${email}`;
}
