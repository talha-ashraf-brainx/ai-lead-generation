import type { CsvPreview } from '../../types/lead'
import { IconAlertTriangle } from '../ui/icons'

export function CsvPreviewTable({ preview }: { preview: CsvPreview }) {
  const validCount = preview.rows.filter((row) => row.isValid).length
  const invalidCount = preview.rows.length - validCount

  return (
    <div className="flex flex-col gap-3">
      {preview.missingColumns.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-temp-hot/40 bg-temp-hot/10 px-3 py-2.5 text-sm text-temp-hot">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Missing required column{preview.missingColumns.length > 1 ? 's' : ''}:{' '}
            {preview.missingColumns.join(', ')}. Rows without a match will be marked invalid.
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 font-mono text-xs text-slate-400">
        <span className="text-fog-100">{preview.rows.length} rows parsed</span>
        <span className="text-temp-cold">{validCount} valid</span>
        {invalidCount > 0 && <span className="text-temp-hot">{invalidCount} invalid</span>}
      </div>

      <div className="max-h-80 overflow-auto rounded-lg border border-graphite-700">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="sticky top-0 bg-graphite-800 font-mono text-xs text-slate-400 uppercase">
            <tr>
              <th className="px-4 py-2.5 font-medium">Row</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Contact</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Website</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-700">
            {preview.rows.map((row) => (
              <tr key={row.rowNumber} className={row.isValid ? '' : 'bg-temp-hot/5'}>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.rowNumber}</td>
                <td className="px-4 py-2.5 text-fog-100">{row.company || '—'}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.contactName || '—'}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.email || '—'}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.website || '—'}</td>
                <td className="px-4 py-2.5">
                  {row.isValid ? (
                    <span className="text-xs text-temp-cold">Ready</span>
                  ) : (
                    <span className="text-xs text-temp-hot" title={row.issues.join(', ')}>
                      {row.issues[0]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
