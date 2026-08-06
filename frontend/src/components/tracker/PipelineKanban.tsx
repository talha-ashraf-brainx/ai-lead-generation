import type { Lead, LeadStatus } from '../../types/lead'
import { Skeleton } from '../ui/Skeleton'

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'var(--color-slate-500)' },
  { status: 'contacted', label: 'Contacted', color: 'var(--color-temp-cold)' },
  { status: 'opened', label: 'Opened', color: 'var(--color-temp-cool)' },
  { status: 'replied', label: 'Replied', color: 'var(--color-temp-warm)' },
  { status: 'converted', label: 'Converted', color: 'var(--color-temp-hot)' },
]

interface PipelineKanbanProps {
  leads: Lead[]
  isLoading: boolean
  onOpenLead: (id: string) => void
}

export function PipelineKanban({ leads, isLoading, onOpenLead }: PipelineKanbanProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.status)
        return (
          <div
            key={column.status}
            className="flex flex-col gap-2 rounded-lg border border-graphite-700 bg-graphite-900 p-3"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: column.color }} />
                <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">{column.label}</p>
              </div>
              <span className="font-mono text-xs text-slate-500">{columnLeads.length}</span>
            </div>
            <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : columnLeads.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-slate-500">No leads</p>
              ) : (
                columnLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onOpenLead(lead.id)}
                    className="rounded-md border border-graphite-700 bg-graphite-800 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-graphite-750"
                  >
                    <p className="truncate text-sm font-medium text-fog-50">{lead.company}</p>
                    <p className="truncate text-xs text-slate-400">{lead.contactName}</p>
                    {lead.campaignName && (
                      <p className="mt-1 truncate font-mono text-[11px] text-slate-500">{lead.campaignName}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
