import { Worker } from "bullmq";
import { Campaign } from "../entities/Campaign.js";
import { CampaignSend } from "../entities/CampaignSend.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { env } from "../lib/env.js";
import { FOLLOWUP_DELAYS_MS } from "../lib/followUpSchedule.js";
import { buildReplyToAddress } from "../lib/inboundReply.js";
import { logger } from "../lib/logger.js";
import { redisConnection } from "../lib/redis.js";
import { sendEmail } from "../lib/resendClient.js";
import { renderTemplate } from "../lib/textUtils.js";
import { recordTrackingEvent } from "../services/campaignSendTrackingService.js";
import { notifyFollowUp } from "../services/notificationService.js";
import type { SendStage } from "../types/campaign.js";
import { EMAIL_QUEUE_NAME, enqueueSendJob } from "./emailQueue.js";

// Mirrors the frontend mock's roughly-90%-open-rate feel for seed mode — real opens
// come from the Resend webhook, this just exercises the same code path in dev.
const SEED_OPEN_SIMULATION_RATE = 0.7;
const SEED_OPEN_DELAY_MS = [2000, 6000] as const;

function campaigns() {
  return AppDataSource.getRepository(Campaign);
}

function campaignSends() {
  return AppDataSource.getRepository(CampaignSend);
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

async function markCampaignActiveIfSettled(campaignId: string): Promise<void> {
  const stillQueued = await campaignSends().count({ where: { campaignId, stage: "initial", status: "queued" } });
  if (stillQueued === 0) {
    await campaigns().update(campaignId, { status: "active", sentAt: new Date() });
  }
}

function simulateSeedOpen(campaignSendId: string): void {
  if (Math.random() >= SEED_OPEN_SIMULATION_RATE) return;
  const delay = SEED_OPEN_DELAY_MS[0] + Math.random() * (SEED_OPEN_DELAY_MS[1] - SEED_OPEN_DELAY_MS[0]);
  setTimeout(() => {
    void recordTrackingEvent({ type: "email.opened", campaignSendId }).catch((err) => {
      logger.error("Seed open simulation failed", { campaignSendId, error: err instanceof Error ? err.message : err });
    });
  }, delay);
}

async function scheduleNextStage(campaignId: string, leadId: string, stage: Extract<SendStage, "day3" | "day7">): Promise<void> {
  const campaign = await campaigns().findOne({ where: { id: campaignId } });
  if (!campaign) return;

  const enabled = stage === "day3" ? campaign.followUpDay3Enabled : campaign.followUpDay7Enabled;
  if (!enabled) return;

  const lead = await leads().findOne({ where: { id: leadId } });
  if (!lead) return;

  const subjectTemplate = stage === "day3" ? campaign.followUpDay3Subject : campaign.followUpDay7Subject;
  const bodyTemplate = stage === "day3" ? campaign.followUpDay3Body : campaign.followUpDay7Body;

  const send = await campaignSends().save(
    campaignSends().create({
      campaignId,
      leadId,
      stage,
      status: "queued",
      subject: renderTemplate(subjectTemplate, lead),
      body: renderTemplate(bodyTemplate, lead),
    }),
  );

  await enqueueSendJob(send.id, FOLLOWUP_DELAYS_MS[stage]);
}

async function processSend(campaignSendId: string): Promise<void> {
  const send = await campaignSends().findOne({ where: { id: campaignSendId } });
  if (!send) return;

  const lead = await leads().findOne({ where: { id: send.leadId } });
  if (!lead) {
    await campaignSends().update(send.id, { status: "failed", errorMessage: "Lead no longer exists" });
    return;
  }

  // Follow-up conditional on no reply (FR): initial sends always go out, but a day3/day7
  // job checks the lead's current status — Phase 6 wires the actual reply detection that
  // flips this to "replied"/"converted" via the inbound webhook.
  if (send.stage !== "initial" && (lead.status === "replied" || lead.status === "converted")) {
    await campaignSends().update(send.id, { status: "skipped" });
    return;
  }

  if (!lead.email) {
    await campaignSends().update(send.id, { status: "failed", errorMessage: "Lead has no email address" });
    if (send.stage === "initial") await markCampaignActiveIfSettled(send.campaignId);
    return;
  }

  try {
    let messageId: string;
    if (env.seedMode) {
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 400));
      messageId = `seed-${send.id}`;
    } else {
      const result = await sendEmail({
        to: lead.email,
        fromEmail: env.resendFromEmail,
        fromName: env.resendFromName,
        subject: send.subject,
        text: send.body,
        replyTo: buildReplyToAddress(send.id),
        customArgs: { campaignSendId: send.id },
      });
      messageId = result.messageId;
    }

    await campaignSends().update(send.id, { status: "sent", resendMessageId: messageId, sentAt: new Date() });
    if (env.seedMode) simulateSeedOpen(send.id);

    if (send.stage === "initial") {
      await markCampaignActiveIfSettled(send.campaignId);
      await scheduleNextStage(send.campaignId, lead.id, "day3");
    } else {
      await notifyFollowUp(lead, send.stage);
      if (send.stage === "day3") await scheduleNextStage(send.campaignId, lead.id, "day7");
    }
  } catch (err) {
    logger.error("Campaign send failed", { sendId: send.id, error: err instanceof Error ? err.message : err });
    await campaignSends().update(send.id, {
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown send error",
    });
    if (send.stage === "initial") await markCampaignActiveIfSettled(send.campaignId);
  }
}

export function startEmailWorker(): Worker {
  const worker = new Worker(EMAIL_QUEUE_NAME, (job) => processSend(job.data.campaignSendId), { connection: redisConnection });
  worker.on("failed", (job, err) => {
    logger.error("Email send job failed permanently", { jobId: job?.id, error: err.message });
  });
  return worker;
}
