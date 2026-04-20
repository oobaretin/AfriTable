import nodemailer from "nodemailer";

/**
 * Outbound email via SMTP (no third-party API). Typical free setup: Gmail with an App Password.
 *
 * Configure one of:
 * - `SMTP_URL` (e.g. smtps://user:pass@smtp.gmail.com:465)
 * - `GMAIL_USER` + `GMAIL_APP_PASSWORD` (implies smtp.gmail.com:587)
 * - `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` (optional `SMTP_PORT`, `SMTP_SECURE`)
 *
 * `EMAIL_FROM` / `SMTP_FROM` — From header (defaults to the SMTP user).
 */

export function isSmtpConfigured(): boolean {
  if (process.env.SMTP_URL?.trim()) return true;
  const gu = process.env.GMAIL_USER?.trim();
  const gp = process.env.GMAIL_APP_PASSWORD?.trim();
  if (gu && gp) return true;
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(host && user && pass);
}

export function getDefaultMailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "therealtasteofafrica@gmail.com"
  );
}

function createTransport() {
  const url = process.env.SMTP_URL?.trim();
  if (url) {
    return nodemailer.createTransport(url);
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass },
    });
  }

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  throw new Error("Invalid SMTP configuration: set SMTP_URL, or GMAIL_USER + GMAIL_APP_PASSWORD, or SMTP_HOST + SMTP_USER + SMTP_PASS.");
}

export type SendSmtpMailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

export async function sendSmtpMail(input: SendSmtpMailInput): Promise<{ ok: boolean }> {
  if (!isSmtpConfigured()) {
    console.warn("sendSmtpMail: no SMTP configured (set GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_*). Skipping send.");
    return { ok: false };
  }

  const from = getDefaultMailFrom();

  try {
    const transport = createTransport();
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return { ok: true };
  } catch (err) {
    console.error("sendSmtpMail failed:", err);
    return { ok: false };
  }
}
