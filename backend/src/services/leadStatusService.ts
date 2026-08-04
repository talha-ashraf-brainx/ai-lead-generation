import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { LeadStatus } from "../types/lead.js";
import { notifyConversion } from "./notificationService.js";

function leads() {
  return AppDataSource.getRepository(Lead);
}

// Manual override — unlike the automatic open/reply tracking, this sets the status
// directly (no forward-only guard) since it's a human decision (e.g. marking a lead
// "converted" after a call, which has no automated signal per SRS scope).
export async function setLeadStatus(leadId: string, status: LeadStatus): Promise<Lead> {
  const lead = await leads().findOne({ where: { id: leadId } });
  if (!lead) throw new ApiError(404, "Lead not found");

  const wasConverted = lead.status === "converted";
  lead.status = status;
  if (status === "opened" && !lead.openedAt) lead.openedAt = new Date();
  if (status === "replied" && !lead.repliedAt) lead.repliedAt = new Date();
  if (status === "converted" && !lead.convertedAt) lead.convertedAt = new Date();
  const saved = await leads().save(lead);

  if (status === "converted" && !wasConverted) await notifyConversion(saved);

  return saved;
}
