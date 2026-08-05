import { CampaignSend } from "../entities/CampaignSend.js";
import { Lead } from "../entities/Lead.js";
import { AppDataSource } from "../lib/dataSource.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { SendStage } from "../types/campaign.js";

export type ActivityKind = "sent" | "opened" | "replied" | "follow_up" | "converted";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  label: string;
  timestamp: string;
}

const STAGE_SENT_LABEL: Record<SendStage, string> = {
  initial: "Email sent",
  day3: "Day-3 follow-up sent",
  day7: "Day-7 follow-up sent",
};

function leads() {
  return AppDataSource.getRepository(Lead);
}

function sends() {
  return AppDataSource.getRepository(CampaignSend);
}

// Built from the real send/open events in campaign_sends plus the lead's own
// repliedAt/convertedAt — replies aren't campaign_sends rows (see
// campaignSendTrackingService.recordReply), they live on the lead itself.
export async function getLeadActivity(leadId: string): Promise<ActivityEvent[]> {
  const lead = await leads().findOne({ where: { id: leadId } });
  if (!lead) throw new ApiError(404, "Lead not found");

  const leadSends = await sends().find({ where: { leadId }, order: { createdAt: "ASC" } });
  const events: ActivityEvent[] = [];

  leadSends.forEach((send) => {
    if (send.sentAt) {
      const label = send.stage === "initial" && lead.campaignName
        ? `${STAGE_SENT_LABEL[send.stage]} · ${lead.campaignName}`
        : STAGE_SENT_LABEL[send.stage];
      events.push({
        id: `${send.id}-sent`,
        kind: send.stage === "initial" ? "sent" : "follow_up",
        label,
        timestamp: send.sentAt.toISOString(),
      });
    }
    if (send.openedAt) {
      events.push({ id: `${send.id}-opened`, kind: "opened", label: "Email opened", timestamp: send.openedAt.toISOString() });
    }
  });

  if (lead.repliedAt) {
    events.push({ id: `${lead.id}-replied`, kind: "replied", label: "Reply received", timestamp: lead.repliedAt.toISOString() });
  }
  if (lead.convertedAt) {
    events.push({ id: `${lead.id}-converted`, kind: "converted", label: "Marked converted", timestamp: lead.convertedAt.toISOString() });
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
