import type { Lead, LeadStatus } from '../../types/lead'
import { StatusBadge } from '../ui/StatusBadge'
import { Skeleton } from '../ui/Skeleton'

const GROUPS: { status: LeadStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'opened', label: 'Opened' },
  { status: 'replied', label: 'Replied' },
  { status: 'converted', label: 'Converted' },
]

interface PipelineTableProps {
  leads: Lead[]
  isLoading: boolean
  onOpenLead: (id: string) => void
}

export function PipelineTable({ leads, isLoading, onOpenLead }: PipelineTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => {
        const groupLeads = leads.filter((lead) => lead.status === group.status)
        if (groupLeads.length === 0) return null
        return (
          <div key={group.status} className="overflow-hidden rounded-lg border border-graphite-700">
            <div className="flex items-center justify-between bg-graphite-800 px-4 py-2.5">
              <p className="font-mono text-xs tracking-wide text-slate-300 uppercase">{group.label}</p>
              <span className="font-mono text-xs text-slate-500">{groupLeads.length}</span>
            </div>
            <div className="divide-y divide-graphite-700">
              {groupLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => onOpenLead(lead.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-graphite-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fog-50">{lead.company}</p>
                    <p className="truncate text-xs text-slate-400">{lead.contactName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden font-mono text-xs text-slate-500 sm:inline">
                      {lead.campaignName ?? '—'}
                    </span>
                    <StatusBadge status={lead.status} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
