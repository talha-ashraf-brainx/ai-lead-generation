import { Worker } from "bullmq";
import { Campaign } from "../entities/Campaign.js";
import { CampaignSend } from "../entities/CampaignSend.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { resolveSendRecipient } from "../lib/debugRecipient.js";
import { env } from "../lib/env.js";
import { FOLLOWUP_DELAYS_MS } from "../lib/followUpSchedule.js";
import { buildReplyToAddress } from "../lib/inboundReply.js";
import { logger } from "../lib/logger.js";
import { redisConnection } from "../lib/redis.js";
import { sendEmail } from "../lib/resendClient.js";
import { renderTemplate } from "../lib/textUtils.js";
import { advanceLeadStatus } from "../services/campaignSendTrackingService.js";
import { notifyFollowUp } from "../services/notificationService.js";
import type { SendStage } from "../types/campaign.js";
import { EMAIL_QUEUE_NAME, enqueueSendJob } from "./emailQueue.js";

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
      userId: lead.userId,
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
    const recipient = resolveSendRecipient(lead.email, {
      debug: env.debug,
      redirectTo: env.debugEmailRedirectTo,
    });
    if (recipient.redirectedFrom) {
      // logger.warn (not .info) so the substitution is visible in the in-app Debug panel,
      // which only captures warn/error — a silent redirect would look like a real send.
      logger.warn("Debug mode: send redirected away from the real lead", {
        sendId: send.id,
        intendedTo: recipient.redirectedFrom,
        sentTo: recipient.to,
      });
    }

    const result = await sendEmail({
      to: recipient.to,
      fromEmail: env.resendFromEmail,
      fromName: env.resendFromName,
      subject: send.subject,
      text: send.body,
      replyTo: buildReplyToAddress(send.id),
      customArgs: { campaignSendId: send.id },
    });

    await campaignSends().update(send.id, { status: "sent", resendMessageId: result.messageId, sentAt: new Date() });

    if (send.stage === "initial") {
      await advanceLeadStatus(lead.id, "contacted");
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
