import { CAMPAIGN_OPTIONS, bulkAddToCampaign, fetchLead, listLeadIdsForCampaign } from './leads'
import type { Lead } from '../../types/lead'
import type { Campaign, CampaignStatus, CampaignSummary, CreateCampaignInput, FollowUpConfig } from '../../types/campaign'

// Prototype-only mock backend. Mirrors the future campaign-orchestration API
// (create -> queue -> send via SendGrid, schedule follow-ups via BullMQ).

const STORAGE_KEY = 'emberline.campaigns.v1'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `camp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

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

function seedCampaigns(): Campaign[] {
  const now = Date.now()
  return CAMPAIGN_OPTIONS.map((option, index) => {
    const status: CampaignStatus = index === 0 ? 'active' : index === 1 ? 'completed' : 'draft'
    const createdAt = new Date(now - (index + 2) * 6 * 86_400_000).toISOString()
    return {
      id: option.id,
      name: option.name,
      status,
      leadIds: listLeadIdsForCampaign(option.id),
      schedule: 'immediate',
      scheduledAt: null,
      followUps: DEFAULT_FOLLOW_UPS,
      createdAt,
      sentAt: status === 'draft' ? null : new Date(now - (index + 2) * 5 * 86_400_000).toISOString(),
    }
  })
}

let cache: Campaign[] | null = null

function readStore(): Campaign[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      cache = JSON.parse(raw) as Campaign[]
      return cache
    }
  } catch {
    // fall through to reseed on corrupt storage
  }
  cache = seedCampaigns()
  writeStore(cache)
  return cache
}

function writeStore(campaigns: Campaign[]) {
  cache = campaigns
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns))
  notifyListeners()
}

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeToCampaigns(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  await delay(300)
  return [...readStore()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function fetchCampaign(id: string): Promise<Campaign | undefined> {
  await delay(250)
  return readStore().find((campaign) => campaign.id === id)
}

export async function fetchCampaignLeads(campaign: Campaign): Promise<Lead[]> {
  const leads = await Promise.all(campaign.leadIds.map((id) => fetchLead(id)))
  return leads.filter((lead): lead is Lead => Boolean(lead))
}

export function listCampaignSummaries(): CampaignSummary[] {
  return readStore().map((campaign) => ({ id: campaign.id, name: campaign.name }))
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  await delay(500)
  const id = makeId()
  const campaign: Campaign = {
    id,
    name: input.name,
    status: 'sending',
    leadIds: input.leadIds,
    schedule: input.schedule,
    scheduledAt: input.scheduledAt,
    followUps: input.followUps,
    createdAt: new Date().toISOString(),
    sentAt: null,
  }
  writeStore([campaign, ...readStore()])
  await bulkAddToCampaign(input.leadIds, id, input.name)

  setTimeout(() => {
    const store = readStore()
    const updated = store.map((existing) =>
      existing.id === id ? { ...existing, status: 'active' as const, sentAt: new Date().toISOString() } : existing,
    )
    writeStore(updated)
  }, 1600)

  return campaign
}
