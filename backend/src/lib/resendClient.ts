import { Resend } from "resend";
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

let client: Resend | null = null;

function getClient(): Resend {
  if (!env.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
  client ??= new Resend(env.resendApiKey);
  return client;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getClient();

  const { data, error } = await resend.emails.send({
    to: input.to,
    from: `${input.fromName} <${input.fromEmail}>`,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    tags: input.customArgs
      ? Object.entries(input.customArgs).map(([name, value]) => ({ name, value }))
      : undefined,
  });

  if (error || !data) throw new Error(error?.message ?? "Resend did not return an email id");
  return { messageId: data.id };
}
