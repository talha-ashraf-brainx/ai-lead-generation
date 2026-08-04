import { CampaignSend } from "../entities/CampaignSend.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { isForwardLeadStatus } from "../lib/leadStatusRank.js";
import { logger } from "../lib/logger.js";
import { notifyReply } from "./notificationService.js";
import type { LeadStatus } from "../types/lead.js";

// Shape of a single SendGrid Event Webhook entry we care about. `campaignSendId` is
// echoed back verbatim because we pass it as a customArg at send time (see
// sendgridClient.sendEmail) — far more reliable than trying to re-derive it from
// SendGrid's message id, which gets suffixed between send and webhook delivery.
export interface SendGridEvent {
  event?: string;
  timestamp?: number;
  campaignSendId?: string;
  reason?: string;
  [key: string]: unknown;
}

function sends() {
  return AppDataSource.getRepository(CampaignSend);
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

// Returns the updated lead if the transition actually happened, or null if it was a
// no-op (already at/past that status) — callers use this to avoid notifying twice.
async function advanceLeadStatus(leadId: string, status: LeadStatus): Promise<Lead | null> {
  const lead = await leads().findOne({ where: { id: leadId } });
  if (lead && isForwardLeadStatus(lead.status, status)) {
    const patch: Partial<Lead> = { status };
    if (status === "opened") patch.openedAt = new Date();
    if (status === "replied") patch.repliedAt = new Date();
    await leads().update(leadId, patch);
    return { ...lead, ...patch };
  }
  return null;
}

export async function recordSendGridEvent(event: SendGridEvent): Promise<void> {
  if (!event.campaignSendId) return;
  const send = await sends().findOne({ where: { id: event.campaignSendId } });
  if (!send) return;

  const occurredAt = event.timestamp ? new Date(event.timestamp * 1000) : new Date();

  switch (event.event) {
    case "delivered":
      if (send.status === "sent") await sends().update(send.id, { status: "delivered" });
      break;
    case "open":
      await sends().update(send.id, { status: "opened", openedAt: occurredAt });
      await advanceLeadStatus(send.leadId, "opened");
      break;
    case "click":
      await sends().update(send.id, { status: "clicked", clickedAt: occurredAt });
      await advanceLeadStatus(send.leadId, "opened");
      break;
    case "bounce":
    case "dropped":
      await sends().update(send.id, {
        status: "bounced",
        bouncedAt: occurredAt,
        errorMessage: typeof event.reason === "string" ? event.reason : null,
      });
      break;
    default:
      break;
  }
}

// Entry point for the SendGrid Inbound Parse webhook (see routes/webhooks.ts). Unlike
// open/click tracking this doesn't touch the CampaignSend row — an inbound reply isn't
// itself a send event, it just needs to flip the lead's status so future follow-up
// jobs see it and skip (see emailWorker.processSend's reply check).
export async function recordReply(campaignSendId: string): Promise<void> {
  const send = await sends().findOne({ where: { id: campaignSendId } });
  if (!send) return;

  const updatedLead = await advanceLeadStatus(send.leadId, "replied");
  if (updatedLead) await notifyReply(updatedLead);
}

export async function applySendGridEvents(events: unknown[]): Promise<void> {
  for (const raw of events) {
    try {
      await recordSendGridEvent(raw as SendGridEvent);
    } catch (err) {
      logger.error("Failed to apply SendGrid event", { error: err instanceof Error ? err.message : err });
    }
  }
}
