import { sendSmtpMail } from "@/lib/email/smtp";
import { getSiteInboxEmail } from "@/lib/email/site-inbox-email";

export { getSiteInboxEmail } from "./site-inbox-email";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type SendSiteInboxNotificationInput = {
  subject: string;
  htmlBody: string;
  textBody?: string;
  replyTo?: string;
};

/**
 * Sends an internal notification to the site inbox via SMTP.
 * Best-effort: returns ok:false if SMTP is not configured or send fails (does not throw).
 */
export async function sendSiteInboxNotification(input: SendSiteInboxNotificationInput): Promise<{ ok: boolean }> {
  const to = getSiteInboxEmail();
  return sendSmtpMail({
    to,
    subject: input.subject,
    html: input.htmlBody,
    text: input.textBody ?? stripHtml(input.htmlBody),
    replyTo: input.replyTo,
  });
}
