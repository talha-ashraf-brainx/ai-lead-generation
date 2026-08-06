import type { EnrichmentStatus, LeadStatus } from '../../types/lead'
import type { EmailDraftStatus } from '../../types/email'
import type { CampaignStatus, SendStatus } from '../../types/campaign'
import { IconCheck } from './icons'

const STATUS_META: Record<LeadStatus, { label: string; color: string; glow: boolean }> = {
  new: { label: 'New', color: 'var(--color-slate-500)', glow: false },
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

// Email draft state is a separate scale from Signal Temperature (lead engagement) —
// it tracks AI-draft vs user-reviewed, not contacted/opened/replied/converted.
const DRAFT_META: Record<EmailDraftStatus, { label: string; className: string }> = {
  draft: { label: 'AI Draft', className: 'border-graphite-600 bg-graphite-800 text-slate-300' },
  edited: { label: 'Edited', className: 'border-primary/40 bg-primary/10 text-primary' },
  approved: { label: 'Approved', className: 'border-transparent bg-primary text-white' },
}

export function EmailDraftBadge({ status }: { status: EmailDraftStatus }) {
  const meta = DRAFT_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${meta.className}`}>
      {status === 'approved' && <IconCheck className="h-3 w-3" />}
      {meta.label}
    </span>
  )
}

// Campaign lifecycle state — also a separate scale from Signal Temperature.
const CAMPAIGN_META: Record<CampaignStatus, { label: string; className: string; pulse?: boolean }> = {
  draft: { label: 'Draft', className: 'border-graphite-600 bg-graphite-800 text-slate-300' },
  sending: { label: 'Sending', className: 'border-primary/40 bg-primary/10 text-primary', pulse: true },
  active: { label: 'Active', className: 'border-transparent bg-primary text-white' },
  completed: { label: 'Completed', className: 'border-graphite-600 bg-graphite-800 text-slate-400' },
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const meta = CAMPAIGN_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${meta.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${meta.pulse ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  )
}

// Per-send delivery outcome (initial email for a lead in a campaign) — distinct from the
// lead's own engagement funnel, which stays "new" whether a send is still queued or has
// failed outright. `null` covers a lead that's in the campaign but has no send row yet
// (e.g. the queue hasn't picked it up).
const SEND_META: Record<SendStatus | 'none', { label: string; className: string; pulse?: boolean }> = {
  none: { label: 'Not queued', className: 'border-graphite-600 bg-graphite-800 text-slate-400' },
  queued: { label: 'Queued', className: 'border-graphite-600 bg-graphite-800 text-slate-300', pulse: true },
  sent: { label: 'Sent', className: 'border-temp-cold/40 bg-temp-cold/10 text-temp-cold' },
  delivered: { label: 'Delivered', className: 'border-temp-cold/40 bg-temp-cold/10 text-temp-cold' },
  opened: { label: 'Opened', className: 'border-temp-cool/40 bg-temp-cool/10 text-temp-cool' },
  clicked: { label: 'Clicked', className: 'border-temp-warm/40 bg-temp-warm/10 text-temp-warm' },
  bounced: { label: 'Bounced', className: 'border-temp-hot/40 bg-temp-hot/10 text-temp-hot' },
  failed: { label: 'Failed', className: 'border-temp-hot/40 bg-temp-hot/10 text-temp-hot' },
  skipped: { label: 'Skipped', className: 'border-graphite-600 bg-graphite-800 text-slate-400' },
}

export function SendStatusBadge({ status, error }: { status: SendStatus | null; error?: string | null }) {
  const meta = SEND_META[status ?? 'none']
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${meta.className}`}
      title={error ?? undefined}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${meta.pulse ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  )
}
