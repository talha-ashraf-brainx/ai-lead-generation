import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BulkActionsBar } from '../../components/leads/BulkActionsBar'
import { LeadDetailDrawer } from '../../components/leads/LeadDetailDrawer'
import { LeadFilters } from '../../components/leads/LeadFilters'
import { LeadsTable } from '../../components/leads/LeadsTable'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Pagination } from '../../components/ui/Pagination'
import { fadeSlideUp } from '../../lib/motion'
import { IconLeads, IconUpload } from '../../components/ui/icons'
import { DEFAULT_LEAD_FILTERS, bulkAddToCampaign, bulkDeleteLeads, fetchLeads, listIndustries } from '../../lib/api/leads'
import { bulkGenerateEmails } from '../../lib/api/emailDrafts'
import { listCampaignSummaries } from '../../lib/api/campaigns'
import type { CampaignOption, Lead, LeadFiltersState } from '../../types/lead'

const PAGE_SIZE = 12
const BACKGROUND_POLL_INTERVAL_MS = 5000

export function LeadsPage() {
  const [filters, setFilters] = useState<LeadFiltersState>(DEFAULT_LEAD_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)
  const [isBulkBusy, setIsBulkBusy] = useState(false)
  const [industries, setIndustries] = useState<string[]>([])
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([])

  // No push channel from the backend for background changes (enrichment completing,
  // a lead opening) — poll instead. This flag keeps a poll tick from thrashing isLoading.
  const isBackgroundRefresh = useRef(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => clearTimeout(timeout)
  }, [filters.search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.status, filters.industry, filters.campaignId])

  useEffect(() => {
    listCampaignSummaries().then(setCampaignOptions)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      isBackgroundRefresh.current = true
      setRefreshTick((tick) => tick + 1)
    }, BACKGROUND_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    const isBackground = isBackgroundRefresh.current
    isBackgroundRefresh.current = false

    if (!isBackground) {
      setIsLoading(true)
      setError(null)
    }

    fetchLeads({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch,
      status: filters.status,
      industry: filters.industry,
      campaignId: filters.campaignId,
    })
      .then((result) => {
        if (cancelled) return
        setLeads(result.rows)
        setTotal(result.total)
        listIndustries().then((industryList) => {
          if (!cancelled) setIndustries(industryList)
        })
        setHasLoadedOnce(true)
      })
      .catch(() => {
        if (!cancelled && !isBackground) setError('Could not load leads. Please try again.')
      })
      .finally(() => {
        if (!cancelled && !isBackground) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, filters.status, filters.industry, filters.campaignId, refreshTick])

  function toggleRow(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds((current) => {
      const allSelected = leads.length > 0 && leads.every((lead) => current.has(lead.id))
      if (allSelected) {
        const next = new Set(current)
        leads.forEach((lead) => next.delete(lead.id))
        return next
      }
      const next = new Set(current)
      leads.forEach((lead) => next.add(lead.id))
      return next
    })
  }

  async function handleAddToCampaign(campaignId: string) {
    setIsBulkBusy(true)
    try {
      await bulkAddToCampaign(Array.from(selectedIds), campaignId)
      setSelectedIds(new Set())
      isBackgroundRefresh.current = true
      setRefreshTick((tick) => tick + 1)
    } finally {
      setIsBulkBusy(false)
    }
  }

  async function handleGenerateEmails() {
    setIsBulkBusy(true)
    try {
      await bulkGenerateEmails(Array.from(selectedIds))
      setSelectedIds(new Set())
    } finally {
      setIsBulkBusy(false)
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} lead${selectedIds.size === 1 ? '' : 's'}? This can't be undone.`)) {
      return
    }
    setIsBulkBusy(true)
    try {
      await bulkDeleteLeads(Array.from(selectedIds))
      setSelectedIds(new Set())
      isBackgroundRefresh.current = true
      setRefreshTick((tick) => tick + 1)
    } finally {
      setIsBulkBusy(false)
    }
  }

  const hasAnyLeadsAtAll = total > 0 || isLoading || Boolean(debouncedSearch) || filters.status !== 'all'
  const showSkeleton = isLoading && !hasLoadedOnce
  const isRefetching = isLoading && hasLoadedOnce

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-fog-50">Leads</h2>
          <p className="mt-1 text-sm text-slate-400">
            {isLoading && total === 0 ? 'Loading leads…' : `${total} total leads in the pipeline`}
          </p>
        </div>
        <Link to="/leads/import">
          <Button className="gap-2">
            <IconUpload className="h-4 w-4" />
            Import leads
          </Button>
        </Link>
      </div>

      <LeadFilters value={filters} industries={industries} campaigns={campaignOptions} onChange={setFilters} />

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <BulkActionsBar
              selectedCount={selectedIds.size}
              isBusy={isBulkBusy}
              campaignOptions={campaignOptions}
              onAddToCampaign={handleAddToCampaign}
              onGenerateEmails={handleGenerateEmails}
              onDelete={handleBulkDelete}
              onClear={() => setSelectedIds(new Set())}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <ErrorState description={error} onRetry={() => setRefreshTick((tick) => tick + 1)} />
      ) : !isLoading && leads.length === 0 ? (
        hasAnyLeadsAtAll ? (
          <EmptyState
            title="No leads match these filters"
            description="Try clearing filters or searching a different term."
            action={
              <Button variant="ghost" onClick={() => setFilters(DEFAULT_LEAD_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<IconLeads className="h-8 w-8" />}
            title="No leads yet"
            description="Import a CSV or search a niche and location to source your first leads."
            action={
              <Link to="/leads/import">
                <Button className="gap-2">
                  <IconUpload className="h-4 w-4" />
                  Import leads
                </Button>
              </Link>
            }
          />
        )
      ) : (
        <motion.div layout className="flex flex-col rounded-lg border border-graphite-700 overflow-hidden">
          <LeadsTable
            leads={leads}
            isLoading={showSkeleton}
            isRefetching={isRefetching}
            skeletonRowCount={PAGE_SIZE}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onOpenLead={setOpenLeadId}
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        </motion.div>
      )}

      <LeadDetailDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
    </div>
  )
}
