import { motion } from 'motion/react'
import { useCountUp } from '../../hooks/useCountUp'
import { staggerContainer, staggerRow } from '../../lib/motion'
import type { LeadStatus } from '../../types/lead'

const STATUS_META: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'var(--color-slate-500)' },
  contacted: { label: 'Contacted', color: 'var(--color-temp-cold)' },
  opened: { label: 'Opened', color: 'var(--color-temp-cool)' },
  replied: { label: 'Replied', color: 'var(--color-temp-warm)' },
  converted: { label: 'Converted', color: 'var(--color-temp-hot)' },
}

const ORDER: LeadStatus[] = ['new', 'contacted', 'opened', 'replied', 'converted']

interface FunnelSummaryProps {
  counts: Partial<Record<LeadStatus, number>>
  total: number
}

function FunnelTile({
  label,
  color,
  count,
  pct,
  total,
}: {
  label: string
  color: string
  count: number
  pct: number
  total: number
}) {
  const value = useCountUp(count, 650, 80)

  return (
    <motion.div
      variants={staggerRow}
      className="relative overflow-hidden rounded-lg bg-graphite-900 p-4"
      style={{ border: `1px solid color-mix(in srgb, ${color} 22%, var(--color-graphite-700))` }}
    >
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">{label}</p>
      </div>
      <p className="mt-2 font-mono text-4xl font-medium tracking-tight text-fog-50 tabular-nums">{value}</p>
      <p className="mt-0.5 font-mono text-xs text-slate-500">
        {pct}% of {total}
      </p>
    </motion.div>
  )
}

export function FunnelSummary({ counts, total }: FunnelSummaryProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {ORDER.map((status) => {
        const meta = STATUS_META[status]
        const count = counts[status] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return <FunnelTile key={status} label={meta.label} color={meta.color} count={count} pct={pct} total={total} />
      })}
    </motion.div>
  )
}
