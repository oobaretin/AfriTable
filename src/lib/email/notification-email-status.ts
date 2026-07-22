import "server-only";

import { getDefaultMailFrom, isSmtpConfigured } from "@/lib/email/smtp";
import { getSiteInboxEmail } from "@/lib/email/site-inbox-email";

function maskEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return "***";
  const maskedLocal = local.length <= 2 ? "**" : `${local[0]}***${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

/** Safe summary for /api/health — no secrets, no full addresses. */
export function getNotificationEmailStatus() {
  const smtpConfigured = isSmtpConfigured();
  const inboxEmail = getSiteInboxEmail();
  const fromEmail = getDefaultMailFrom();
  const siteInboxExplicit = Boolean(process.env.SITE_INBOX_EMAIL?.trim());

  return {
    smtpConfigured,
    siteInboxExplicit,
    inbox: maskEmail(inboxEmail),
    from: maskEmail(fromEmail),
    /** True when SMTP can send form notifications to a configured inbox. */
    ready: smtpConfigured && Boolean(fromEmail) && Boolean(inboxEmail),
    provider:
      process.env.SMTP_URL?.trim() ? "smtp_url" : process.env.GMAIL_USER?.trim() ? "gmail" : process.env.SMTP_HOST?.trim() ? "smtp_host" : null,
  };
}
