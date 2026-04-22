/**
 * Public @afritable.com contact addresses (shown in UI and mailto links only).
 * Server delivery uses SITE_INBOX_EMAIL / SMTP env — never put a personal Gmail here.
 */
export const SITE_CONTACT = {
  hello: "hello@afritable.com",
  partners: "partners@afritable.com",
  partnerships: "partnerships@afritable.com",
  support: "support@afritable.com",
  sales: "sales@afritable.com",
  privacy: "privacy@afritable.com",
  /** Default server notification To: if SITE_INBOX_EMAIL is unset; not shown on marketing pages. */
  contact: "contact@afritable.com",
} as const;

export function mailto(email: string): string {
  return `mailto:${email}`;
}
