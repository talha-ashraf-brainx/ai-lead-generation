import { fetchLeads } from './leads'
import { fetchCampaignLeads, fetchCampaigns } from './campaigns'
import { buildActivityTimeline } from './activity'
import type { Lead } from '../../types/lead'
import type { AnalyticsDateRange, AnalyticsOverview, AnalyticsSeries, CampaignBreakdownRow } from '../../types/analytics'

// Prototype-only mock backend. Rates are derived from the same lead/status data
// the Leads and Tracker modules use; the trend series reuses the Tracker's
// synthetic activity timeline so all three modules agree on the same events.

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const LEAD_PAGE_SIZE = 500
const BUCKET_COUNT = 14

function computeRates(leads: Lead[]): AnalyticsOverview {
  const total = leads.length
  if (total === 0) return { total: 0, openRate: 0, replyRate: 0, conversionRate: 0 }

  const opened = leads.filter((lead) => lead.status === 'opened' || lead.status === 'replied' || lead.status === 'converted').length
  const replied = leads.filter((lead) => lead.status === 'replied' || lead.status === 'converted').length
  const converted = leads.filter((lead) => lead.status === 'converted').length

  return {
    total,
    openRate: Math.round((opened / total) * 100),
    replyRate: Math.round((replied / total) * 100),
    conversionRate: Math.round((converted / total) * 100),
  }
}

async function fetchFilteredLeads(range: AnalyticsDateRange): Promise<Lead[]> {
  const result = await fetchLeads({
    page: 1,
    pageSize: LEAD_PAGE_SIZE,
    createdAfter: range.dateFrom,
    createdBefore: range.dateTo,
  })
  return result.rows
}

export async function fetchAnalyticsOverview(range: AnalyticsDateRange): Promise<AnalyticsOverview> {
  await delay(350)
  const leads = await fetchFilteredLeads(range)
  return computeRates(leads)
}

export async function fetchAnalyticsSeries(range: AnalyticsDateRange): Promise<AnalyticsSeries> {
  await delay(300)
  const leads = await fetchFilteredLeads(range)

  const eventTimestamps: Record<'opened' | 'replied' | 'converted', number[]> = { opened: [], replied: [], converted: [] }
  leads.forEach((lead) => {
    buildActivityTimeline(lead).forEach((event) => {
      if (event.kind === 'opened' || event.kind === 'replied' || event.kind === 'converted') {
        eventTimestamps[event.kind].push(new Date(event.timestamp).getTime())
      }
    })
  })

  const allTimestamps = [...eventTimestamps.opened, ...eventTimestamps.replied, ...eventTimestamps.converted]
  if (allTimestamps.length === 0) {
    return { opened: [], replied: [], converted: [] }
  }

  const min = Math.min(...allTimestamps)
  const max = Math.max(...allTimestamps)
  const bucketSize = Math.max(max - min, 86_400_000) / BUCKET_COUNT

  function bucket(timestamps: number[]) {
    const counts = Array.from({ length: BUCKET_COUNT }, () => 0)
    timestamps.forEach((timestamp) => {
      const index = Math.min(BUCKET_COUNT - 1, Math.floor((timestamp - min) / bucketSize))
      counts[index]++
    })
    return counts.map((value, index) => ({ date: new Date(min + index * bucketSize).toISOString(), value }))
  }

  return {
    opened: bucket(eventTimestamps.opened),
    replied: bucket(eventTimestamps.replied),
    converted: bucket(eventTimestamps.converted),
  }
}

export async function fetchCampaignBreakdown(range: AnalyticsDateRange): Promise<CampaignBreakdownRow[]> {
  await delay(300)
  const campaigns = await fetchCampaigns()

  const rows = await Promise.all(
    campaigns.map(async (campaign) => {
      const leads = await fetchCampaignLeads(campaign)
      const filtered = leads.filter((lead) => {
        if (range.dateFrom && lead.createdAt < range.dateFrom) return false
        if (range.dateTo && lead.createdAt > range.dateTo) return false
        return true
      })
      return { campaignId: campaign.id, campaignName: campaign.name, ...computeRates(filtered) }
    }),
  )

  return rows
}
