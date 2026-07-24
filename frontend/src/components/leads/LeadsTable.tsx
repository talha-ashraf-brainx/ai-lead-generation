import type { Lead } from '../../types/lead'
import { Checkbox } from '../ui/Checkbox'
import { EnrichmentBadge, StatusBadge } from '../ui/StatusBadge'
import { TableRowSkeleton } from '../ui/Skeleton'
import { IconExternalLink } from '../ui/icons'

interface LeadsTableProps {
  leads: Lead[]
  isLoading: boolean
  skeletonRowCount: number
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onToggleAll: () => void
  onOpenLead: (id: string) => void
}

const COLUMN_COUNT = 7

export function LeadsTable({
  leads,
  isLoading,
  skeletonRowCount,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onOpenLead,
}: LeadsTableProps) {
  const allSelected = leads.length > 0 && leads.every((lead) => selectedIds.has(lead.id))
  const someSelected = leads.some((lead) => selectedIds.has(lead.id))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-graphite-800 font-mono text-xs text-slate-400 uppercase">
          <tr>
            <th className="w-10 px-4 py-3">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onChange={onToggleAll}
                aria-label="Select all leads on this page"
              />
            </th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Enrichment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-graphite-700">
          {isLoading
            ? Array.from({ length: skeletonRowCount }, (_, i) => (
                <TableRowSkeleton key={i} columns={COLUMN_COUNT} />
              ))
            : leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onOpenLead(lead.id)}
                  className={`cursor-pointer transition-colors hover:bg-graphite-800/60 ${
                    selectedIds.has(lead.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onChange={() => onToggleRow(lead.id)}
                      aria-label={`Select ${lead.company}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-fog-50">{lead.company}</p>
                    <p className="text-xs text-slate-500">{lead.industry}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{lead.contactName}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-1 text-slate-400 hover:text-primary"
                      >
                        {lead.website.replace(/^https?:\/\//, '')}
                        <IconExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    <EnrichmentBadge status={lead.enrichment} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
