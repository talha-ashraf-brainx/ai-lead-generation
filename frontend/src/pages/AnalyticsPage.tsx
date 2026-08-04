import { useEffect, useState } from 'react'
import { fetchAnalyticsOverview, fetchAnalyticsSeries, fetchCampaignBreakdown } from '../lib/api/analytics'
import { StatCard } from '../components/analytics/StatCard'
import { AnalyticsFilters, DEFAULT_ANALYTICS_FILTERS, type AnalyticsFiltersValue } from '../components/analytics/AnalyticsFilters'
import { CampaignBreakdownTable } from '../components/analytics/CampaignBreakdownTable'
import type { AnalyticsOverview, AnalyticsSeries, CampaignBreakdownRow } from '../types/analytics'

const EMPTY_OVERVIEW: AnalyticsOverview = { total: 0, openRate: 0, replyRate: 0, conversionRate: 0 }
const EMPTY_SERIES: AnalyticsSeries = { opened: [], replied: [], converted: [] }

export function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFiltersValue>(DEFAULT_ANALYTICS_FILTERS)
  const [overview, setOverview] = useState<AnalyticsOverview>(EMPTY_OVERVIEW)
  const [series, setSeries] = useState<AnalyticsSeries>(EMPTY_SERIES)
  const [breakdown, setBreakdown] = useState<CampaignBreakdownRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    const range = {
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
      dateTo: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).toISOString() : undefined,
    }

    Promise.all([fetchAnalyticsOverview(range), fetchAnalyticsSeries(range), fetchCampaignBreakdown(range)]).then(
      ([overviewResult, seriesResult, breakdownResult]) => {
        if (cancelled) return
        setOverview(overviewResult)
        setSeries(seriesResult)
        setBreakdown(breakdownResult)
        setIsLoading(false)
        setHasLoadedOnce(true)
      },
    )

    return () => {
      cancelled = true
    }
  }, [filters])

  const showSkeleton = isLoading && !hasLoadedOnce
  const isRefetching = isLoading && hasLoadedOnce

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-medium text-fog-50">Analytics</h2>
        <p className="mt-1 text-sm text-slate-400">
          {showSkeleton ? 'Crunching numbers…' : `Based on ${overview.total} lead${overview.total === 1 ? '' : 's'}`}
        </p>
      </div>

      <AnalyticsFilters value={filters} onChange={setFilters} />

      <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-3 ${isRefetching ? 'opacity-60' : ''}`}>
        <StatCard label="Open rate" value={overview.openRate} color="var(--color-temp-cool)" trend={series.opened} isLoading={showSkeleton} />
        <StatCard label="Reply rate" value={overview.replyRate} color="var(--color-temp-warm)" trend={series.replied} isLoading={showSkeleton} />
        <StatCard
          label="Conversion rate"
          value={overview.conversionRate}
          color="var(--color-temp-hot)"
          trend={series.converted}
          isLoading={showSkeleton}
        />
      </div>

      <div className={`transition-opacity ${isRefetching ? 'opacity-60' : ''}`}>
        <p className="mb-2 font-mono text-xs tracking-wide text-slate-400 uppercase">Per-campaign breakdown</p>
        <CampaignBreakdownTable rows={breakdown} isLoading={showSkeleton} />
      </div>
    </div>
  )
}
