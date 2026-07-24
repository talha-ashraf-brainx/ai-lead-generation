import type { LeadFiltersState, LeadStatus } from '../../types/lead'
import { CAMPAIGN_OPTIONS, DEFAULT_LEAD_FILTERS } from '../../lib/mock/leads'
import { Select } from '../ui/Select'
import { IconSearch, IconX } from '../ui/icons'

const STATUS_OPTIONS: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'opened', label: 'Opened' },
  { value: 'replied', label: 'Replied' },
  { value: 'converted', label: 'Converted' },
]

interface LeadFiltersProps {
  value: LeadFiltersState
  industries: string[]
  onChange: (next: LeadFiltersState) => void
}

export function LeadFilters({ value, industries, onChange }: LeadFiltersProps) {
  const isFiltered =
    value.search || value.status !== 'all' || value.industry !== 'all' || value.campaignId !== 'all'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex flex-1 flex-col gap-1.5">
        <label className="font-mono text-xs tracking-wide text-slate-400 uppercase">Search</label>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={value.search}
            onChange={(event) => onChange({ ...value, search: event.target.value })}
            placeholder="Company, contact, or email"
            className="w-full rounded-md border border-graphite-600 bg-graphite-900 py-2.5 pr-3 pl-9 text-sm text-fog-50 outline-none transition-colors placeholder:text-slate-500 focus:border-primary"
          />
        </div>
      </div>

      <div className="w-full sm:w-44">
        <Select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value as LeadStatus | 'all' })}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-44">
        <Select value={value.industry} onChange={(event) => onChange({ ...value, industry: event.target.value })}>
          <option value="all">All industries</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-48">
        <Select
          value={value.campaignId}
          onChange={(event) => onChange({ ...value, campaignId: event.target.value })}
        >
          <option value="all">All campaigns</option>
          <option value="none">No campaign</option>
          {CAMPAIGN_OPTIONS.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </Select>
      </div>

      {isFiltered && (
        <button
          onClick={() => onChange(DEFAULT_LEAD_FILTERS)}
          className="flex items-center gap-1 rounded-md px-2 py-2.5 text-sm text-slate-400 transition-colors hover:text-fog-100"
        >
          <IconX className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
