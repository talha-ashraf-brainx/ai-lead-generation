import { Link } from 'react-router-dom'
import type { ImportSummary } from '../../types/lead'
import { Button } from '../ui/Button'
import { IconAlertTriangle, IconCheck } from '../ui/icons'

interface ImportSummaryCardProps {
  summary: ImportSummary
  note?: string
  onReset: () => void
}

export function ImportSummaryCard({ summary, note, onReset }: ImportSummaryCardProps) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-graphite-700 bg-graphite-900 p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-temp-cold/15 text-temp-cold">
          <IconCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-base font-medium text-fog-50">Import complete</p>
          {note && <p className="text-sm text-slate-400">{note}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-graphite-700 rounded-md border border-graphite-700">
        <div className="px-4 py-3 text-center">
          <p className="font-mono text-2xl text-fog-50">{summary.importedCount}</p>
          <p className="mt-1 text-xs text-slate-500">Imported</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="font-mono text-2xl text-fog-50">{summary.duplicateCount}</p>
          <p className="mt-1 text-xs text-slate-500">Duplicates skipped</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className={`font-mono text-2xl ${summary.errorCount > 0 ? 'text-temp-hot' : 'text-fog-50'}`}>
            {summary.errorCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Errors</p>
        </div>
      </div>

      {summary.errorDetails.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-temp-hot">
            <IconAlertTriangle className="h-3.5 w-3.5" />
            Rows skipped
          </p>
          <ul className="max-h-32 overflow-y-auto rounded-md border border-graphite-700 divide-y divide-graphite-700 font-mono text-xs text-slate-400">
            {summary.errorDetails.map((detail) => (
              <li key={detail.row} className="px-3 py-1.5">
                Row {detail.row}: {detail.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onReset}>
          Import more
        </Button>
        <Link to="/leads">
          <Button>View leads</Button>
        </Link>
      </div>
    </div>
  )
}
