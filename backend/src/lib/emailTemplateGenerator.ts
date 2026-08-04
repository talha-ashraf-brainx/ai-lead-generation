import { firstName } from "./textUtils.js";

// Synthetic email copy used only in SEED_MODE, so the generation/review flow works
// end-to-end before burning OpenAI credits. Mirrors the frontend mock's variety.
const OPENERS = [
  { subject: (company: string) => `Quick idea for ${company}`, hook: "came across your site and had a quick thought" },
  { subject: (company: string) => `${company} + fewer missed follow-ups`, hook: "wanted to flag something I noticed" },
  { subject: (company: string) => `Helping ${company} close more leads`, hook: "figured this was worth a quick note" },
  { subject: (company: string) => `A question about ${company}'s pipeline`, hook: "hope this lands at a good time" },
];

let variantCounter = 0;

export interface SeedEmailInput {
  company: string;
  contactName: string;
  industry: string;
  painPoint: string | null;
}

export function generateSeedEmailCopy(lead: SeedEmailInput): { subject: string; body: string } {
  const opener = OPENERS[variantCounter++ % OPENERS.length];
  const painPoint = lead.painPoint ?? "keeping the pipeline full";
  const subject = opener.subject(lead.company);
  const body = [
    `Hi ${firstName(lead.contactName)},`,
    "",
    `I ${opener.hook} — a lot of ${lead.industry.toLowerCase()} teams we talk to are dealing with ${painPoint}, and it's usually a follow-up problem, not a marketing one.`,
    "",
    `We help teams like ${lead.company} turn more inbound interest into booked business without adding headcount. Worth a 15-minute call this week?`,
    "",
    "Best,",
    "Emberline Outreach",
  ].join("\n");

  return { subject, body };
}
