import { CampaignSend } from "../entities/CampaignSend.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { isForwardLeadStatus } from "../lib/leadStatusRank.js";
import { logger } from "../lib/logger.js";
import { notifyReply } from "./notificationService.js";
import type { LeadStatus } from "../types/lead.js";

// Shape of a single Resend webhook delivery — one event per HTTP call (unlike
// SendGrid, which batched an array of events per request).
export interface ResendWebhookEvent {
  type?: string;
  created_at?: string;
  data?: {
    tags?: unknown;
    bounce?: { message?: string };
    [key: string]: unknown;
  };
}

// `campaignSendId` is echoed back verbatim in `data.tags` because we pass it as a tag
// at send time (see resendClient.sendEmail) — far more reliable than trying to re-derive
// it from Resend's email id, which we'd otherwise have to persist and cross-reference.
// Tags may come back as an array of {name, value} or as a plain object map — handle both
// since Resend's documented shape for this wasn't pinned down at implementation time.
export function findTag(tags: unknown, name: string): string | null {
  if (Array.isArray(tags)) {
    const entry = tags.find((tag) => tag && typeof tag === "object" && (tag as Record<string, unknown>).name === name);
    const value = entry ? (entry as Record<string, unknown>).value : undefined;
    return typeof value === "string" ? value : null;
  }
  if (tags && typeof tags === "object") {
    const value = (tags as Record<string, unknown>)[name];
    return typeof value === "string" ? value : null;
  }
  return null;
}

function sends() {
  return AppDataSource.getRepository(CampaignSend);
}

function leads() {
  return AppDataSource.getRepository(Lead);
}

// Returns the updated lead if the transition actually happened, or null if it was a
// no-op (already at/past that status) — callers use this to avoid notifying twice.
export async function advanceLeadStatus(leadId: string, status: LeadStatus): Promise<Lead | null> {
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

export interface TrackingEvent {
  type: string;
  campaignSendId: string;
  occurredAt?: Date;
  errorMessage?: string | null;
}

export async function recordTrackingEvent(event: TrackingEvent): Promise<void> {
  const send = await sends().findOne({ where: { id: event.campaignSendId } });
  if (!send) return;

  const occurredAt = event.occurredAt ?? new Date();

  switch (event.type) {
    case "email.delivered":
      if (send.status === "sent") await sends().update(send.id, { status: "delivered" });
      break;
    case "email.opened":
      await sends().update(send.id, { status: "opened", openedAt: occurredAt });
      await advanceLeadStatus(send.leadId, "opened");
      break;
    case "email.clicked":
      await sends().update(send.id, { status: "clicked", clickedAt: occurredAt });
      await advanceLeadStatus(send.leadId, "opened");
      break;
    case "email.bounced":
      await sends().update(send.id, {
        status: "bounced",
        bouncedAt: occurredAt,
        errorMessage: event.errorMessage ?? null,
      });
      break;
    case "email.failed":
      await sends().update(send.id, { status: "failed", errorMessage: event.errorMessage ?? null });
      break;
    default:
      break;
  }
}

export async function recordResendEvent(raw: ResendWebhookEvent): Promise<void> {
  const campaignSendId = findTag(raw.data?.tags, "campaignSendId");
  if (!campaignSendId) return;

  await recordTrackingEvent({
    type: raw.type ?? "",
    campaignSendId,
    occurredAt: raw.created_at ? new Date(raw.created_at) : undefined,
    errorMessage: typeof raw.data?.bounce?.message === "string" ? raw.data.bounce.message : null,
  });
}

// Entry point for the Resend inbound-email webhook (see routes/webhooks.ts). Unlike
// open/click tracking this doesn't touch the CampaignSend row — an inbound reply isn't
// itself a send event, it just needs to flip the lead's status so future follow-up
// jobs see it and skip (see emailWorker.processSend's reply check).
export async function recordReply(campaignSendId: string): Promise<void> {
  const send = await sends().findOne({ where: { id: campaignSendId } });
  if (!send) return;

  const updatedLead = await advanceLeadStatus(send.leadId, "replied");
  if (updatedLead) await notifyReply(updatedLead);
}
