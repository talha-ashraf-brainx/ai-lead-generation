import { useEffect, useState } from 'react'
import { fetchLead } from '../../lib/mock/leads'
import { bulkGenerateEmails, fetchEmailDraft } from '../../lib/mock/emailDrafts'
import { Button } from '../ui/Button'
import { EmailDraftBadge } from '../ui/StatusBadge'
import { Skeleton } from '../ui/Skeleton'
import { IconChevronDown, IconMail } from '../ui/icons'
import type { Lead } from '../../types/lead'
import type { EmailDraft } from '../../types/email'

interface EmailReviewStepProps {
  leadIds: string[]
}

type Row = { lead: Lead; draft: EmailDraft | undefined }

export function EmailReviewStep({ leadIds }: EmailReviewStepProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [isBulkGenerating, setIsBulkGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    Promise.all(
      leadIds.map(async (id) => {
        const [lead, draft] = await Promise.all([fetchLead(id), fetchEmailDraft(id)])
        return lead ? { lead, draft } : null
      }),
    ).then((results) => {
      if (!cancelled) {
        setRows(results.filter((row): row is Row => Boolean(row)))
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadIds, refreshTick])

  const missingCount = rows.filter((row) => !row.draft).length

  async function handleGenerateMissing() {
    setIsBulkGenerating(true)
    try {
      const missingIds = rows.filter((row) => !row.draft).map((row) => row.lead.id)
      await bulkGenerateEmails(missingIds)
      setTimeout(() => setRefreshTick((tick) => tick + 1), missingIds.length * 300 + 1200)
    } finally {
      setIsBulkGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {missingCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="text-sm text-fog-100">
            {missingCount} lead{missingCount === 1 ? '' : 's'} still need a draft generated.
          </p>
          <Button variant="ghost" className="gap-1.5" onClick={handleGenerateMissing} isLoading={isBulkGenerating}>
            <IconMail className="h-4 w-4" />
            Generate missing drafts
          </Button>
        </div>
      )}

      <div className="flex flex-col divide-y divide-graphite-700 rounded-lg border border-graphite-700">
        {rows.map(({ lead, draft }) => {
          const isExpanded = expandedId === lead.id
          return (
            <div key={lead.id} className="flex flex-col">
              <button
                onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                className="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-graphite-800/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-fog-50">{lead.company}</p>
                  <p className="truncate text-xs text-slate-400">{draft ? draft.subject : 'No draft yet'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {draft ? (
                    <EmailDraftBadge status={draft.status} />
                  ) : (
                    <span className="font-mono text-xs text-slate-500">Pending</span>
                  )}
                  <IconChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-graphite-700 bg-graphite-800/40 px-4 py-3">
                  {draft ? (
                    <p className="whitespace-pre-line text-sm text-slate-300">{draft.body}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Generate a draft for this lead to preview it here.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
