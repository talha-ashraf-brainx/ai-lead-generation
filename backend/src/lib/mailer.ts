import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!env.smtpHost || !env.smtpUsername || !env.smtpPassword) {
    throw new Error("SMTP is not configured (SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD)");
  }

  transporter ??= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUsername, pass: env.smtpPassword },
  });

  return transporter;
}

export interface AlertEmailInput {
  subject: string;
  text: string;
}

// Internal alert emails (e.g. "a lead replied") — distinct from SendGrid, which is
// only for outreach/campaign emails (Phase 5).
export async function sendAlertEmail(input: AlertEmailInput): Promise<void> {
  const transport = getTransporter();
  await transport.sendMail({
    from: { name: env.smtpFromName, address: env.smtpFromEmail },
    to: env.accountOwnerEmail,
    subject: `Emberline: ${input.subject}`,
    text: input.text,
  });
}
