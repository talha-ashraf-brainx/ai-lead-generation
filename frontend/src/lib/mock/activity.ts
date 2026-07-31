import type { Lead } from '../../types/lead'
import type { ActivityEvent } from '../../types/activity'

// Deterministic per-lead timeline derived from status + createdAt — a prototype
// stand-in for the real send/open/reply event log SendGrid webhooks will populate.

function seedFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash
}

function offsetHours(seed: number, index: number, min: number, max: number): number {
  const fraction = (seed * (index + 7)) % 1000 / 1000
  return min + fraction * (max - min)
}

const STATUS_ORDER: Lead['status'][] = ['contacted', 'opened', 'replied', 'converted']

export function buildActivityTimeline(lead: Lead): ActivityEvent[] {
  const seed = seedFromId(lead.id)
  const base = new Date(lead.createdAt).getTime()
  const reachedIndex = STATUS_ORDER.indexOf(lead.status)
  const events: ActivityEvent[] = []

  events.push({
    id: `${lead.id}-sent`,
    kind: 'sent',
    label: lead.campaignName ? `Email sent · ${lead.campaignName}` : 'Email sent',
    timestamp: new Date(base).toISOString(),
  })

  if (reachedIndex === 0) {
    events.push({
      id: `${lead.id}-followup3`,
      kind: 'follow_up',
      label: 'Day-3 follow-up sent',
      timestamp: new Date(base + 3 * 86_400_000).toISOString(),
    })
  }

  if (reachedIndex >= 1) {
    events.push({
      id: `${lead.id}-opened`,
      kind: 'opened',
      label: 'Email opened',
      timestamp: new Date(base + offsetHours(seed, 1, 2, 30) * 3_600_000).toISOString(),
    })
  }

  if (reachedIndex >= 2) {
    events.push({
      id: `${lead.id}-replied`,
      kind: 'replied',
      label: 'Reply received',
      timestamp: new Date(base + offsetHours(seed, 2, 24, 96) * 3_600_000).toISOString(),
    })
  }

  if (reachedIndex >= 3) {
    events.push({
      id: `${lead.id}-converted`,
      kind: 'converted',
      label: 'Marked converted',
      timestamp: new Date(base + offsetHours(seed, 3, 120, 240) * 3_600_000).toISOString(),
    })
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}
