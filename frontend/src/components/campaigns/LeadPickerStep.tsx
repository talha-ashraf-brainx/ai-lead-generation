import { useEffect, useState } from 'react'
import { fetchLeads } from '../../lib/api/leads'
import { Checkbox } from '../ui/Checkbox'
import { TextField } from '../ui/TextField'
import { StatusBadge } from '../ui/StatusBadge'
import { Skeleton } from '../ui/Skeleton'
import { IconSearch } from '../ui/icons'
import type { Lead } from '../../types/lead'

interface LeadPickerStepProps {
  campaignName: string
  onCampaignNameChange: (name: string) => void
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

const PAGE_SIZE = 200

export function LeadPickerStep({ campaignName, onCampaignNameChange, selectedIds, onToggle }: LeadPickerStepProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchLeads({ page: 1, pageSize: PAGE_SIZE, search: debouncedSearch }).then((result) => {
      if (!cancelled) {
        setLeads(result.rows)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="Campaign name"
        placeholder="e.g. Dental Q3 Follow-up"
        value={campaignName}
        onChange={(event) => onCampaignNameChange(event.target.value)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">
          {selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'} selected
        </p>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, contact, or email"
            className="w-64 rounded-md border border-graphite-600 bg-graphite-900 py-2 pr-3 pl-9 text-sm text-fog-50 outline-none placeholder:text-slate-500 focus:border-primary"
          />
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-lg border border-graphite-700">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-graphite-800 font-mono text-xs text-slate-400 uppercase">
            <tr>
              <th className="w-10 px-4 py-2.5" />
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Contact</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-700">
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={4}>
                    <Skeleton className="h-4 w-full max-w-64" />
                  </td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={4}>
                  No leads match that search.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onToggle(lead.id)}
                  className={`cursor-pointer transition-colors hover:bg-graphite-800/60 ${
                    selectedIds.has(lead.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-2.5" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onChange={() => onToggle(lead.id)}
                      aria-label={`Select ${lead.company}`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-fog-50">{lead.company}</p>
                    <p className="text-xs text-slate-500">{lead.industry}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{lead.contactName}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={lead.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
