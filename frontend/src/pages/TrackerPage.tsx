import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fetchLeads } from '../lib/mock/leads'
import { listCampaignSummaries } from '../lib/mock/campaigns'
import { FunnelSummary } from '../components/tracker/FunnelSummary'
import { PipelineKanban } from '../components/tracker/PipelineKanban'
import { PipelineTable } from '../components/tracker/PipelineTable'
import { DEFAULT_TRACKER_FILTERS, TrackerFilters, type TrackerFiltersValue } from '../components/tracker/TrackerFilters'
import { LeadActivityDrawer } from '../components/tracker/LeadActivityDrawer'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { IconGauge, IconLayoutGrid, IconListBullets } from '../components/ui/icons'
import type { Lead, LeadStatus } from '../types/lead'
import type { CampaignSummary } from '../types/campaign'

const PAGE_SIZE = 500
type ViewMode = 'kanban' | 'table'

export function TrackerPage() {
  const [filters, setFilters] = useState<TrackerFiltersValue>(DEFAULT_TRACKER_FILTERS)
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [view, setView] = useState<ViewMode>('kanban')
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)

  useEffect(() => {
    setCampaigns(listCampaignSummaries())
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchLeads({
      page: 1,
      pageSize: PAGE_SIZE,
      campaignId: filters.campaignId,
      createdAfter: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : undefined,
      createdBefore: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).toISOString() : undefined,
    }).then((result) => {
      if (!cancelled) {
        setLeads(result.rows)
        setIsLoading(false)
        setHasLoadedOnce(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [filters])

  const showSkeleton = isLoading && !hasLoadedOnce
  const isRefetching = isLoading && hasLoadedOnce

  const counts = leads.reduce<Partial<Record<LeadStatus, number>>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-medium text-fog-50">Lead Tracker</h2>
        <p className="mt-1 text-sm text-slate-400">Pipeline health across every contacted lead.</p>
      </div>

      <FunnelSummary counts={counts} total={leads.length} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <TrackerFilters value={filters} campaigns={campaigns} onChange={setFilters} />
        <div className="flex gap-1 rounded-md border border-graphite-700 bg-graphite-900 p-1">
          <button
            onClick={() => setView('kanban')}
            aria-label="Kanban view"
            className={`rounded p-2 transition-colors ${
              view === 'kanban' ? 'bg-graphite-700 text-fog-50' : 'text-slate-400 hover:text-fog-100'
            }`}
          >
            <IconLayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('table')}
            aria-label="Table view"
            className={`rounded p-2 transition-colors ${
              view === 'table' ? 'bg-graphite-700 text-fog-50' : 'text-slate-400 hover:text-fog-100'
            }`}
          >
            <IconListBullets className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!showSkeleton && leads.length === 0 ? (
        <EmptyState
          icon={<IconGauge className="h-8 w-8" />}
          title="No leads match these filters"
          description="Try a different campaign or widen the date range."
          action={
            <Button variant="ghost" onClick={() => setFilters(DEFAULT_TRACKER_FILTERS)}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <motion.div
          layout
          className={`transition-opacity duration-300 ${isRefetching ? 'pointer-events-none opacity-40' : 'opacity-100'}`}
        >
          {view === 'kanban' ? (
            <PipelineKanban leads={leads} isLoading={showSkeleton} onOpenLead={setOpenLeadId} />
          ) : (
            <PipelineTable leads={leads} isLoading={showSkeleton} onOpenLead={setOpenLeadId} />
          )}
        </motion.div>
      )}

      <LeadActivityDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
    </div>
  )
}
