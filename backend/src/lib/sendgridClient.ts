import sgMail from "@sendgrid/mail";
import { env } from "./env.js";

export interface SendEmailInput {
  to: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  replyTo?: string;
  customArgs?: Record<string, string>;
}

export interface SendEmailResult {
  messageId: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.sendgridApiKey) throw new Error("SENDGRID_API_KEY is not configured");
  sgMail.setApiKey(env.sendgridApiKey);

  const [response] = await sgMail.send({
    to: input.to,
    from: { email: input.fromEmail, name: input.fromName },
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    customArgs: input.customArgs,
  });

  const messageId = response.headers["x-message-id"];
  if (typeof messageId !== "string") throw new Error("SendGrid did not return a message id");
  return { messageId };
}
