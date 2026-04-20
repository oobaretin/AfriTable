const DEFAULT_SITE_INBOX = "therealtasteofafrica@gmail.com";

/** Inbox for notifications from public forms (override via SITE_INBOX_EMAIL). */
export function getSiteInboxEmail(): string {
  const raw = process.env.SITE_INBOX_EMAIL?.trim();
  return raw || DEFAULT_SITE_INBOX;
}
