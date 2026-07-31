import { IconX } from '../ui/icons'

export interface AnalyticsFiltersValue {
  dateFrom: string
  dateTo: string
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFiltersValue = { dateFrom: '', dateTo: '' }

interface AnalyticsFiltersProps {
  value: AnalyticsFiltersValue
  onChange: (next: AnalyticsFiltersValue) => void
}

export function AnalyticsFilters({ value, onChange }: AnalyticsFiltersProps) {
  const isFiltered = Boolean(value.dateFrom) || Boolean(value.dateTo)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs tracking-wide text-slate-400 uppercase">From</label>
        <input
          type="date"
          value={value.dateFrom}
          onChange={(event) => onChange({ ...value, dateFrom: event.target.value })}
          className="rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 text-sm text-fog-50 outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs tracking-wide text-slate-400 uppercase">To</label>
        <input
          type="date"
          value={value.dateTo}
          onChange={(event) => onChange({ ...value, dateTo: event.target.value })}
          className="rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 text-sm text-fog-50 outline-none focus:border-primary"
        />
      </div>
      {isFiltered && (
        <button
          onClick={() => onChange(DEFAULT_ANALYTICS_FILTERS)}
          className="flex items-center gap-1 rounded-md px-2 py-2.5 text-sm text-slate-400 transition-colors hover:text-fog-100"
        >
          <IconX className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
