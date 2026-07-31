import { useEffect, useMemo, useState } from 'react'
import { fetchLead } from '../../lib/mock/leads'
import { buildActivityTimeline } from '../../lib/mock/activity'
import { Drawer } from '../ui/Drawer'
import { Skeleton } from '../ui/Skeleton'
import { StatusBadge } from '../ui/StatusBadge'
import type { Lead } from '../../types/lead'
import type { ActivityEvent } from '../../types/activity'

const KIND_META: Record<ActivityEvent['kind'], { color: string }> = {
  sent: { color: 'var(--color-temp-cold)' },
  opened: { color: 'var(--color-temp-cool)' },
  follow_up: { color: 'var(--color-slate-400)' },
  replied: { color: 'var(--color-temp-warm)' },
  converted: { color: 'var(--color-temp-hot)' },
}

export function LeadActivityDrawer({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!leadId) return
    let cancelled = false
    setIsLoading(true)
    setLead(null)
    fetchLead(leadId).then((result) => {
      if (!cancelled) {
        setLead(result ?? null)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [leadId])

  const timeline = useMemo(() => (lead ? buildActivityTimeline(lead) : []), [lead])

  return (
    <Drawer open={leadId !== null} onClose={onClose} title={lead?.company ?? 'Lead activity'}>
      {isLoading || !lead ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={lead.status} />
            {lead.campaignName && <span className="font-mono text-xs text-slate-400">{lead.campaignName}</span>}
          </div>

          <div>
            <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">Activity timeline</p>
            <ol className="mt-3 flex flex-col gap-4">
              {timeline.map((event, index) => (
                <li key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: KIND_META[event.kind].color }}
                    />
                    {index < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-graphite-700" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm text-fog-100">{event.label}</p>
                    <p className="font-mono text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Drawer>
  )
}
