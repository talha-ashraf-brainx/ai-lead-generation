import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import type { ImportSummary } from '../../types/lead'
import { useCountUp } from '../../hooks/useCountUp'
import { staggerContainer, staggerRow } from '../../lib/motion'
import { Button } from '../ui/Button'
import { IconAlertTriangle, IconCheck } from '../ui/icons'

interface ImportSummaryCardProps {
  summary: ImportSummary
  note?: string
  onReset: () => void
}

function SummaryStat({ value, label, tone }: { value: number; label: string; tone?: 'hot' }) {
  const count = useCountUp(value, 600, 120)
  return (
    <motion.div variants={staggerRow} className="px-4 py-3 text-center">
      <p className={`font-mono text-2xl ${tone === 'hot' ? 'text-temp-hot' : 'text-fog-50'}`}>{count}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </motion.div>
  )
}

export function ImportSummaryCard({ summary, note, onReset }: ImportSummaryCardProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      <motion.div variants={staggerRow} className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-temp-cold/15 text-temp-cold">
          <IconCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-base font-medium text-fog-50">Import complete</p>
          {note && <p className="text-sm text-slate-400">{note}</p>}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 divide-x divide-graphite-700 rounded-md bg-graphite-800/40">
        <SummaryStat value={summary.importedCount} label="Imported" />
        <SummaryStat value={summary.duplicateCount} label="Duplicates skipped" />
        <SummaryStat value={summary.errorCount} label="Errors" tone={summary.errorCount > 0 ? 'hot' : undefined} />
      </div>

      {summary.errorDetails.length > 0 && (
        <motion.div variants={staggerRow} className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-temp-hot">
            <IconAlertTriangle className="h-3.5 w-3.5" />
            Rows skipped
          </p>
          <ul className="max-h-32 overflow-y-auto rounded-md bg-graphite-800/40 divide-y divide-graphite-700 font-mono text-xs text-slate-400">
            {summary.errorDetails.map((detail) => (
              <li key={detail.row} className="px-3 py-1.5">
                Row {detail.row}: {detail.reason}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div variants={staggerRow} className="flex gap-3">
        <Button variant="ghost" onClick={onReset}>
          Import more
        </Button>
        <Link to="/leads">
          <Button>View leads</Button>
        </Link>
      </motion.div>
    </motion.div>
  )
}
