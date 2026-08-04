export const CAMPAIGN_STATUSES = ["draft", "sending", "active", "completed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_SCHEDULES = ["immediate", "scheduled"] as const;
export type CampaignSchedule = (typeof CAMPAIGN_SCHEDULES)[number];

export const SEND_STAGES = ["initial", "day3", "day7"] as const;
export type SendStage = (typeof SEND_STAGES)[number];

export const SEND_STATUSES = ["queued", "sent", "delivered", "opened", "clicked", "bounced", "failed", "skipped"] as const;
export type SendStatus = (typeof SEND_STATUSES)[number];

export interface FollowUpStepInput {
  enabled: boolean;
  subject: string;
  body: string;
}

export interface FollowUpConfigInput {
  day3: FollowUpStepInput;
  day7: FollowUpStepInput;
}

export interface CreateCampaignInput {
  name: string;
  leadIds: string[];
  schedule: CampaignSchedule;
  scheduledAt: string | null;
  followUps: FollowUpConfigInput;
}
