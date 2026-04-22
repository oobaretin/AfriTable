import { SITE_CONTACT } from "@/lib/site-contact";

/**
 * Server-only recipient for API/form notifications. Set `SITE_INBOX_EMAIL` in production
 * (e.g. personal Gmail). Public UI uses {@link SITE_CONTACT} @afritable.com addresses only.
 */
export function getSiteInboxEmail(): string {
  const raw = process.env.SITE_INBOX_EMAIL?.trim();
  return raw || SITE_CONTACT.contact;
}
