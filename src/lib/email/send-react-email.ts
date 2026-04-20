import * as React from "react";
import { render } from "@react-email/render";
import { sendSmtpMail } from "@/lib/email/smtp";

/** Renders a @react-email component to HTML and sends via SMTP. */
export async function sendReactEmail(opts: {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<{ ok: boolean }> {
  const html = await render(opts.react);
  return sendSmtpMail({
    to: opts.to,
    subject: opts.subject,
    html,
    replyTo: opts.replyTo,
    attachments: opts.attachments,
  });
}
