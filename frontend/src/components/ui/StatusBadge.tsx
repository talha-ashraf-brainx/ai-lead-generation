import type { EnrichmentStatus, LeadStatus } from '../../types/lead'

const STATUS_META: Record<LeadStatus, { label: string; color: string; glow: boolean }> = {
  contacted: { label: 'Contacted', color: 'var(--color-temp-cold)', glow: false },
  opened: { label: 'Opened', color: 'var(--color-temp-cool)', glow: false },
  replied: { label: 'Replied', color: 'var(--color-temp-warm)', glow: true },
  converted: { label: 'Converted', color: 'var(--color-temp-hot)', glow: true },
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-graphite-600 bg-graphite-800 px-2.5 py-1 font-mono text-xs text-fog-100"
      style={meta.glow ? { boxShadow: `0 0 0 1px color-mix(in srgb, ${meta.color} 35%, transparent), 0 0 12px -2px color-mix(in srgb, ${meta.color} 55%, transparent)` } : undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

const ENRICHMENT_META: Record<EnrichmentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'text-slate-400' },
  enriched: { label: 'Enriched', className: 'text-temp-cold' },
  failed: { label: 'Failed', className: 'text-temp-hot' },
}

export function EnrichmentBadge({ status }: { status: EnrichmentStatus }) {
  const meta = ENRICHMENT_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${meta.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  )
}
