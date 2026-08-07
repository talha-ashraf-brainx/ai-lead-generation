import { EmailDraft } from "../entities/EmailDraft.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { logger } from "../lib/logger.js";
import { generateEmailCopy } from "../lib/openaiClient.js";
import { firstName } from "../lib/textUtils.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { EmailDraftStatus, PersonalizationVariable } from "../types/email.js";

function drafts() {
  return AppDataSource.getRepository(EmailDraft);
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

function buildPersonalization(lead: Lead): PersonalizationVariable[] {
  return [
    { label: "Company", value: lead.company },
    { label: "Industry", value: lead.industry },
    { label: "Pain point", value: lead.painPoint ?? "Not detected — using general framing" },
    { label: "Contact", value: firstName(lead.contactName) },
  ];
}

export async function getEmailDraft(leadId: string, userId: string): Promise<EmailDraft | null> {
  return drafts().findOne({ where: { leadId, userId } });
}

// Always regenerates — the frontend calls this both for the first draft and every
// "Regenerate" click, so there's no separate endpoint for the two (matches the mock).
export async function generateEmailDraft(leadId: string, userId: string): Promise<EmailDraft> {
  const lead = await leads().findOne({ where: { id: leadId, userId } });
  if (!lead) throw new ApiError(404, "Lead not found");

  const copy = await generateEmailCopy({
    company: lead.company,
    industry: lead.industry,
    contactFirstName: firstName(lead.contactName),
    painPoint: lead.painPoint,
  });

  const repo = drafts();
  const existing = await repo.findOne({ where: { leadId, userId } });
  if (existing) await repo.remove(existing);

  return repo.save(
    repo.create({
      userId,
      leadId,
      subject: copy.subject,
      body: copy.body,
      status: "draft",
      personalization: buildPersonalization(lead),
      editedAt: null,
    }),
  );
}

export async function saveEmailDraft(
  leadId: string,
  edits: { subject: string; body: string },
  status: Extract<EmailDraftStatus, "edited" | "approved">,
  userId: string,
): Promise<EmailDraft> {
  const repo = drafts();
  const existing = await repo.findOne({ where: { leadId, userId } });
  if (!existing) throw new ApiError(404, "No draft to save");

  existing.subject = edits.subject;
  existing.body = edits.body;
  existing.status = status;
  existing.editedAt = new Date();
  return repo.save(existing);
}

// Fire-and-forget, staggered like the frontend mock's bulkGenerateEmails — individual
// failures surface when a lead is opened for review rather than blocking the batch.
export function enqueueBulkGeneration(leadIds: string[], userId: string): { count: number } {
  leadIds.forEach((leadId, index) => {
    setTimeout(
      () => {
        void generateEmailDraft(leadId, userId).catch((err) => {
          logger.error("Bulk email generation failed for lead", { leadId, error: err instanceof Error ? err.message : err });
        });
      },
      300 + index * 250,
    );
  });
  return { count: leadIds.length };
}
