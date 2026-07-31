export type CampaignStatus = 'draft' | 'sending' | 'active' | 'completed'
export type CampaignSchedule = 'immediate' | 'scheduled'

export interface FollowUpStep {
  enabled: boolean
  subject: string
  body: string
}

export interface FollowUpConfig {
  day3: FollowUpStep
  day7: FollowUpStep
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  leadIds: string[]
  schedule: CampaignSchedule
  scheduledAt: string | null
  followUps: FollowUpConfig
  createdAt: string
  sentAt: string | null
}

export interface CampaignSummary {
  id: string
  name: string
}

export interface CreateCampaignInput {
  name: string
  leadIds: string[]
  schedule: CampaignSchedule
  scheduledAt: string | null
  followUps: FollowUpConfig
}
