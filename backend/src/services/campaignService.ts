import { In } from "typeorm";
import { Campaign } from "../entities/Campaign.js";
import { CampaignSend } from "../entities/CampaignSend.js";
import { EmailDraft } from "../entities/EmailDraft.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { enqueueSendJob } from "../jobs/emailQueue.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { CampaignStatus, CreateCampaignInput } from "../types/campaign.js";

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

function initialSendDelayMs(input: CreateCampaignInput): number {
  if (input.schedule !== "scheduled" || !input.scheduledAt) return 0;
  return Math.max(0, new Date(input.scheduledAt).getTime() - Date.now());
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const campaignLeads = await leads().find({ where: { id: In(input.leadIds) } });
  if (!campaignLeads.length) throw new ApiError(400, "None of the selected leads could be found");

  const campaign = await campaigns().save(
    campaigns().create({
      name: input.name,
      status: "sending",
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

  await leads().save(campaignLeads.map((lead) => ({ ...lead, campaignId: campaign.id, campaignName: campaign.name })));

  const leadDrafts = await drafts().find({ where: { leadId: In(campaignLeads.map((lead) => lead.id)) } });
  const draftByLeadId = new Map(leadDrafts.map((draft) => [draft.leadId, draft]));

  const initialSends = campaignLeads.map((lead) => {
    const draft = draftByLeadId.get(lead.id);
    if (!lead.email) {
      return campaignSends().create({
        campaignId: campaign.id,
        leadId: lead.id,
        stage: "initial",
        status: "failed",
        subject: draft?.subject ?? "",
        body: draft?.body ?? "",
        errorMessage: "Lead has no email address",
      });
    }
    if (!draft) {
      return campaignSends().create({
        campaignId: campaign.id,
        leadId: lead.id,
        stage: "initial",
        status: "failed",
        subject: "",
        body: "",
        errorMessage: "No email draft generated for this lead",
      });
    }
    return campaignSends().create({
      campaignId: campaign.id,
      leadId: lead.id,
      stage: "initial",
      status: "queued",
      subject: draft.subject,
      body: draft.body,
    });
  });

  const savedSends = await campaignSends().save(initialSends);

  const delayMs = initialSendDelayMs(input);
  await Promise.all(savedSends.filter((send) => send.status === "queued").map((send) => enqueueSendJob(send.id, delayMs)));

  return campaign;
}

export async function listCampaigns(): Promise<Campaign[]> {
  return campaigns().find({ order: { createdAt: "DESC" } });
}

export async function getCampaign(id: string): Promise<Campaign> {
  const campaign = await campaigns().findOne({ where: { id } });
  if (!campaign) throw new ApiError(404, "Campaign not found");
  return campaign;
}

export async function getCampaignLeads(campaignId: string): Promise<Lead[]> {
  return leads().find({ where: { campaignId } });
}

// Manual override — e.g. marking a campaign "completed" once its results are in.
export async function setCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
  const campaign = await getCampaign(id);
  campaign.status = status;
  return campaigns().save(campaign);
}
