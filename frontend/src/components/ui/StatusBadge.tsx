import type { EnrichmentStatus, LeadStatus } from '../../types/lead'

const STATUS_META: Record<LeadStatus, { label: string; color: string }> = {
  contacted: { label: 'Contacted', color: 'var(--color-temp-cold)' },
  opened: { label: 'Opened', color: 'var(--color-temp-cool)' },
  replied: { label: 'Replied', color: 'var(--color-temp-warm)' },
  converted: { label: 'Converted', color: 'var(--color-temp-hot)' },
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-graphite-600 bg-graphite-800 px-2.5 py-1 font-mono text-xs text-fog-100">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

const ENRICHMENT_META: Record<EnrichmentStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
  },
  enriched: {
    label: 'Enriched',
    className: 'border-temp-cold/40 bg-temp-cold/10 text-temp-cold',
  },
  failed: {
    label: 'Failed',
    className: 'border-temp-hot/40 bg-temp-hot/10 text-temp-hot',
  },
}

export function EnrichmentBadge({ status }: { status: EnrichmentStatus }) {
  const meta = ENRICHMENT_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${meta.className}`}
    >
      {status === 'pending' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {meta.label}
    </span>
  )
}
