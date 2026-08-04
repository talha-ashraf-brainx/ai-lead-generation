import { apiFetch, isNotFound } from './client'
import type { Lead } from '../../types/lead'
import type { Campaign, CampaignSummary, CreateCampaignInput, FollowUpConfig } from '../../types/campaign'

export const DEFAULT_FOLLOW_UPS: FollowUpConfig = {
  day3: {
    enabled: true,
    subject: "Following up — didn't want this to get buried",
    body: "Hi {{firstName}},\n\nJust bumping this up in case it got lost. Still think there's a quick win here for {{company}} — worth 15 minutes this week?\n\nBest,\nEmberline Outreach",
  },
  day7: {
    enabled: true,
    subject: 'One last note',
    body: "Hi {{firstName}},\n\nI'll leave it here for now — if priorities shift and {{company}} wants to revisit this, just reply and I'll pick it back up.\n\nBest,\nEmberline Outreach",
  },
}

interface RawCampaign {
  id: string
  name: string
  status: Campaign['status']
  schedule: Campaign['schedule']
  scheduledAt: string | null
  followUpDay3Enabled: boolean
  followUpDay3Subject: string
  followUpDay3Body: string
  followUpDay7Enabled: boolean
  followUpDay7Subject: string
  followUpDay7Body: string
  createdAt: string
  sentAt: string | null
}

function adaptFollowUps(raw: RawCampaign): FollowUpConfig {
  return {
    day3: { enabled: raw.followUpDay3Enabled, subject: raw.followUpDay3Subject, body: raw.followUpDay3Body },
    day7: { enabled: raw.followUpDay7Enabled, subject: raw.followUpDay7Subject, body: raw.followUpDay7Body },
  }
}

async function adaptCampaign(raw: RawCampaign): Promise<Campaign> {
  const leads = await fetchCampaignLeads(raw.id)
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    leadIds: leads.map((lead) => lead.id),
    schedule: raw.schedule,
    scheduledAt: raw.scheduledAt,
    followUps: adaptFollowUps(raw),
    createdAt: raw.createdAt,
    sentAt: raw.sentAt,
  }
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const raws = await apiFetch<RawCampaign[]>('/api/campaigns')
  return Promise.all(raws.map(adaptCampaign))
}

export async function fetchCampaign(id: string): Promise<Campaign | undefined> {
  try {
    const raw = await apiFetch<RawCampaign>(`/api/campaigns/${id}`)
    return await adaptCampaign(raw)
  } catch (err) {
    if (isNotFound(err)) return undefined
    throw err
  }
}

export async function fetchCampaignLeads(campaignId: string): Promise<Lead[]> {
  return apiFetch<Lead[]>(`/api/campaigns/${campaignId}/leads`)
}

export async function listCampaignSummaries(): Promise<CampaignSummary[]> {
  const raws = await apiFetch<RawCampaign[]>('/api/campaigns')
  return raws.map((raw) => ({ id: raw.id, name: raw.name }))
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const raw = await apiFetch<RawCampaign>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      leadIds: input.leadIds,
      schedule: input.schedule,
      scheduledAt: input.scheduledAt,
      followUps: input.followUps,
    }),
  })
  return adaptCampaign(raw)
}
