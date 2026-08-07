import { In } from "typeorm";
import { Campaign } from "../entities/Campaign.js";
import { CampaignSend } from "../entities/CampaignSend.js";
import { EmailDraft } from "../entities/EmailDraft.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { enqueueSendJob } from "../jobs/emailQueue.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { CampaignStatus, CreateCampaignInput, SendStatus } from "../types/campaign.js";

function campaigns() {
  return AppDataSource.getRepository(Campaign);
}

function campaignSends() {
  return AppDataSource.getRepository(CampaignSend);
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

function drafts() {
  return AppDataSource.getRepository(EmailDraft);
}

function initialSendDelayMs(campaign: Campaign): number {
  if (campaign.schedule !== "scheduled" || !campaign.scheduledAt) return 0;
  return Math.max(0, campaign.scheduledAt.getTime() - Date.now());
}

// A lead is only ever eligible to be added to / sent by a campaign once it has both a
// real email address and an *approved* draft — an unreviewed AI draft doesn't count.
export function checkCampaignEligibility(lead: Lead, draft: EmailDraft | undefined): string | null {
  if (!lead.email) return "Lead has no email address";
  if (!draft || draft.status !== "approved") return "No approved email draft for this lead";
  return null;
}

function buildInitialSend(campaignId: string, lead: Lead, draft: EmailDraft | undefined): CampaignSend {
  const ineligibleReason = checkCampaignEligibility(lead, draft);
  if (ineligibleReason) {
    return campaignSends().create({
      userId: lead.userId,
      campaignId,
      leadId: lead.id,
      stage: "initial",
      status: "failed",
      subject: draft?.subject ?? "",
      body: draft?.body ?? "",
      errorMessage: ineligibleReason,
    });
  }
  return campaignSends().create({
    userId: lead.userId,
    campaignId,
    leadId: lead.id,
    stage: "initial",
    status: "queued",
    subject: draft!.subject,
    body: draft!.body,
  });
}

// Every lead's initial send is queued through here — both when it's added to a
// pre-existing campaign (bulk-add-to-campaign) and, now that campaigns start out empty,
// that's the *only* path leads ever go through. Returns whether a send actually got
// queued, so callers can flip a "draft" campaign to "sending" the moment one does.
export async function queueInitialSendForLead(lead: Lead, campaign: Campaign): Promise<boolean> {
  // Both arguments are pre-loaded entities, so a caller that resolved them from different
  // accounts would silently cross tenants — fail loudly instead of queueing that send.
  if (lead.userId !== campaign.userId) {
    throw new ApiError(404, "Campaign not found");
  }

  const alreadyExists = await campaignSends().findOne({
    where: { campaignId: campaign.id, leadId: lead.id, stage: "initial", userId: lead.userId },
  });
  if (alreadyExists) return false;

  const draft = await drafts().findOne({ where: { leadId: lead.id, userId: lead.userId } });
  const send = await campaignSends().save(buildInitialSend(campaign.id, lead, draft ?? undefined));
  if (send.status !== "queued") return false;

  await enqueueSendJob(send.id, initialSendDelayMs(campaign));
  return true;
}

// Starts empty — leads are added afterward via bulk-add-to-campaign, which is what
// actually queues their sends (see queueInitialSendForLead). Stays "draft" until then.
export async function createCampaign(input: CreateCampaignInput, userId: string): Promise<Campaign> {
  return campaigns().save(
    campaigns().create({
      userId,
      name: input.name,
      status: "draft",
      schedule: input.schedule,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      followUpDay3Enabled: input.followUps.day3.enabled,
      followUpDay3Subject: input.followUps.day3.subject,
      followUpDay3Body: input.followUps.day3.body,
      followUpDay7Enabled: input.followUps.day7.enabled,
      followUpDay7Subject: input.followUps.day7.subject,
      followUpDay7Body: input.followUps.day7.body,
    }),
  );
}

export async function listCampaigns(userId: string): Promise<Campaign[]> {
  return campaigns().find({ where: { userId }, order: { createdAt: "DESC" } });
}

export async function getCampaign(id: string, userId: string): Promise<Campaign> {
  const campaign = await campaigns().findOne({ where: { id, userId } });
  if (!campaign) throw new ApiError(404, "Campaign not found");
  return campaign;
}

export interface CampaignLead extends Lead {
  initialSendStatus: SendStatus | null;
  initialSendError: string | null;
}

// The lead's own `status` is its engagement funnel (new/contacted/opened/...), which stays
// "new" whether the initial send is still queued or failed outright — it can't tell those
// apart. Send status per lead is a shape only this endpoint's consumer (CampaignLeadsTable)
// needs, so it's layered on here rather than added to the generic Lead contract.
export async function getCampaignLeads(campaignId: string, userId: string): Promise<CampaignLead[]> {
  const campaignLeads = await leads().find({ where: { campaignId, userId } });
  if (!campaignLeads.length) return [];

  const initialSends = await campaignSends().find({
    where: { campaignId, userId, stage: "initial", leadId: In(campaignLeads.map((lead) => lead.id)) },
  });
  const sendByLeadId = new Map(initialSends.map((send) => [send.leadId, send]));

  return campaignLeads.map((lead) => ({
    ...lead,
    initialSendStatus: sendByLeadId.get(lead.id)?.status ?? null,
    initialSendError: sendByLeadId.get(lead.id)?.errorMessage ?? null,
  }));
}

// Manual override — e.g. marking a campaign "completed" once its results are in.
export async function setCampaignStatus(id: string, status: CampaignStatus, userId: string): Promise<Campaign> {
  const campaign = await getCampaign(id, userId);
  campaign.status = status;
  return campaigns().save(campaign);
}
