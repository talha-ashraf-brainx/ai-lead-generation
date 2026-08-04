import OpenAI from "openai";
import { env } from "./env.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.openrouterApiKey) throw new Error("OPENROUTER_API_KEY is not configured");
  client ??= new OpenAI({ apiKey: env.openrouterApiKey, baseURL: OPENROUTER_BASE_URL });
  return client;
}

export interface EmailCopyInput {
  company: string;
  industry: string;
  contactFirstName: string;
  painPoint: string | null;
}

export interface EmailCopy {
  subject: string;
  body: string;
}

const SYSTEM_PROMPT = `You write short, personalized cold outreach emails for Emberline, an agency that helps small businesses convert more inbound leads into booked business.

Rules:
- Subject line under 60 characters, specific to the company, no clickbait.
- Body: 80-130 words, plain text, no markdown, no emoji.
- Open with a specific, credible observation tied to the company's industry and pain point — not a generic compliment.
- One clear call to action: a short call this week.
- Sign off as "Emberline Outreach".
- Respond with ONLY a JSON object of the shape {"subject": string, "body": string}.`;

export async function generateEmailCopy(input: EmailCopyInput): Promise<EmailCopy> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: env.openrouterModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          company: input.company,
          industry: input.industry,
          contactFirstName: input.contactFirstName,
          painPoint: input.painPoint ?? "not detected — use general framing about staying on top of inbound leads",
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenRouter returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenRouter response was not valid JSON");
  }

  const { subject, body } = parsed as { subject?: unknown; body?: unknown };
  if (typeof subject !== "string" || typeof body !== "string") {
    throw new Error("OpenRouter response is missing subject/body");
  }

  return { subject, body };
}
