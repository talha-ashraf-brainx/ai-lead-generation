import { apiFetch, buildQuery } from './client'
import type { AnalyticsDateRange, AnalyticsOverview, AnalyticsSeries, CampaignBreakdownRow } from '../../types/analytics'

export async function fetchAnalyticsOverview(range: AnalyticsDateRange): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>(`/api/analytics/overview${buildQuery({ ...range })}`)
}

export async function fetchAnalyticsSeries(range: AnalyticsDateRange): Promise<AnalyticsSeries> {
  return apiFetch<AnalyticsSeries>(`/api/analytics/series${buildQuery({ ...range })}`)
}

export async function fetchCampaignBreakdown(range: AnalyticsDateRange): Promise<CampaignBreakdownRow[]> {
  return apiFetch<CampaignBreakdownRow[]>(`/api/analytics/campaigns${buildQuery({ ...range })}`)
}
