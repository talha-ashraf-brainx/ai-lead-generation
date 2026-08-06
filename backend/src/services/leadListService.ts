import { In } from "typeorm";
import { Campaign } from "../entities/Campaign.js";
import { EmailDraft } from "../entities/EmailDraft.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { ApiError } from "../middleware/errorHandler.js";
import { checkCampaignEligibility, queueInitialSendForLead } from "./campaignService.js";
import type { LeadStatus } from "../types/lead.js";

export interface ListLeadsParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: LeadStatus | "all";
  industry?: string;
  campaignId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface ListLeadsResult {
  rows: Lead[];
  total: number;
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

function campaigns() {
  return AppDataSource.getRepository(Campaign);
}

export async function listLeads(params: ListLeadsParams): Promise<ListLeadsResult> {
  const qb = leads().createQueryBuilder("lead");

  const search = params.search?.trim();
  if (search) {
    qb.andWhere(
      "(lead.company ILIKE :search OR lead.contactName ILIKE :search OR lead.email ILIKE :search)",
      { search: `%${search}%` },
    );
  }
  if (params.status && params.status !== "all") {
    qb.andWhere("lead.status = :status", { status: params.status });
  }
  if (params.industry && params.industry !== "all") {
    qb.andWhere("lead.industry = :industry", { industry: params.industry });
  }
  if (params.campaignId === "none") {
    qb.andWhere("lead.campaignId IS NULL");
  } else if (params.campaignId && params.campaignId !== "all") {
    qb.andWhere("lead.campaignId = :campaignId", { campaignId: params.campaignId });
  }
  if (params.createdAfter) qb.andWhere("lead.createdAt >= :createdAfter", { createdAfter: params.createdAfter });
  if (params.createdBefore) qb.andWhere("lead.createdAt <= :createdBefore", { createdBefore: params.createdBefore });

  qb.orderBy("lead.createdAt", "DESC");

  const total = await qb.getCount();
  const rows = await qb
    .skip((params.page - 1) * params.pageSize)
    .take(params.pageSize)
    .getMany();

  return { rows, total };
}

export async function getLead(id: string): Promise<Lead> {
  const lead = await leads().findOne({ where: { id } });
  if (!lead) throw new ApiError(404, "Lead not found");
  return lead;
}

export async function listIndustries(): Promise<string[]> {
  const rows = await leads()
    .createQueryBuilder("lead")
    .select("DISTINCT lead.industry", "industry")
    .orderBy("lead.industry", "ASC")
    .getRawMany<{ industry: string }>();
  return rows.map((row) => row.industry);
}

export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await leads().delete(ids);
}

// Debug-mode-only convenience (see routes/leads.ts's env.debug gate) — lets a lead's
// email/website be patched in by hand when a provider fails to fill them in, without
// needing to fake a whole enrichment result.
export async function updateLeadDebugFields(id: string, input: { email?: string | null; website?: string }): Promise<Lead> {
  const lead = await getLead(id);
  if (input.email !== undefined) lead.email = input.email === "" ? null : input.email;
  if (input.website !== undefined) lead.website = input.website;
  return leads().save(lead);
}

function drafts() {
  return AppDataSource.getRepository(EmailDraft);
}

export interface BulkAddToCampaignResult {
  added: Lead[];
  skipped: { id: string; company: string; reason: string }[];
}

// Leads without a real email or an approved draft are never tagged with the campaign
// at all — not just left to fail at send time — so "who's in this campaign" stays an
// accurate answer to "who's actually reachable".
export async function bulkAddLeadsToCampaign(ids: string[], campaignId: string): Promise<BulkAddToCampaignResult> {
  const campaign = await campaigns().findOne({ where: { id: campaignId } });
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (!ids.length) return { added: [], skipped: [] };

  const targetLeads = await leads().find({ where: { id: In(ids) } });
  const leadDrafts = await drafts().find({ where: { leadId: In(targetLeads.map((lead) => lead.id)) } });
  const draftByLeadId = new Map(leadDrafts.map((draft) => [draft.leadId, draft]));

  const eligible: Lead[] = [];
  const skipped: { id: string; company: string; reason: string }[] = [];
  for (const lead of targetLeads) {
    const reason = checkCampaignEligibility(lead, draftByLeadId.get(lead.id));
    if (reason) skipped.push({ id: lead.id, company: lead.company, reason });
    else eligible.push(lead);
  }

  eligible.forEach((lead) => {
    lead.campaignId = campaign.id;
    lead.campaignName = campaign.name;
  });
  const saved = eligible.length ? await leads().save(eligible) : [];

  const queuedResults = await Promise.all(saved.map((lead) => queueInitialSendForLead(lead, campaign)));
  if (campaign.status === "draft" && queuedResults.some(Boolean)) {
    await campaigns().update(campaign.id, { status: "sending" });
  }

  return { added: saved, skipped };
}
