import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCampaign, fetchCampaignLeads, type CampaignLead } from '../../lib/api/campaigns'
import { CampaignLeadsTable } from '../../components/campaigns/CampaignLeadsTable'
import { CampaignStatusBadge } from '../../components/ui/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { IconChevronLeft } from '../../components/ui/icons'
import type { Campaign } from '../../types/campaign'
import type { LeadStatus } from '../../types/lead'

const FUNNEL_STATUSES: LeadStatus[] = ['new', 'contacted', 'opened', 'replied', 'converted']

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: 'var(--color-slate-500)',
  contacted: 'var(--color-temp-cold)',
  opened: 'var(--color-temp-cool)',
  replied: 'var(--color-temp-warm)',
  converted: 'var(--color-temp-hot)',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function CampaignDetailPage() {
  const { campaignId = '' } = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [leads, setLeads] = useState<CampaignLead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchCampaign(campaignId).then(async (result) => {
      if (cancelled) return
      setCampaign(result ?? null)
      if (result) {
        const campaignLeads = await fetchCampaignLeads(result.id)
        if (!cancelled) setLeads(campaignLeads)
      }
      if (!cancelled) setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const statusCounts = leads.reduce<Partial<Record<LeadStatus, number>>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-5">
      <Link to="/campaigns" className="flex w-fit items-center gap-1 text-sm text-slate-400 hover:text-fog-100">
        <IconChevronLeft className="h-4 w-4" />
        Back to campaigns
      </Link>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !campaign ? (
        <ErrorState description="This campaign couldn't be found." />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-medium text-fog-50">{campaign.name}</h2>
              <p className="mt-1 text-sm text-slate-400">
                Created {formatDate(campaign.createdAt)}
                {campaign.sentAt ? ` · Sent ${formatDate(campaign.sentAt)}` : ''}
                {campaign.schedule === 'scheduled' && campaign.scheduledAt
                  ? ` · Scheduled for ${formatDate(campaign.scheduledAt)}`
                  : ''}
              </p>
            </div>
            <CampaignStatusBadge status={campaign.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FUNNEL_STATUSES.map((status) => {
              const color = STATUS_COLOR[status]
              return (
                <div
                  key={status}
                  className="relative overflow-hidden rounded-lg bg-graphite-900 p-4"
                  style={{ border: `1px solid color-mix(in srgb, ${color} 22%, var(--color-graphite-700))` }}
                >
                  <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
                  <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">{status}</p>
                  <p className="mt-2 font-mono text-3xl font-medium tracking-tight text-fog-50 tabular-nums">
                    {statusCounts[status] ?? 0}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-graphite-700 bg-graphite-900 p-4">
            <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">Follow-up sequence</p>
            <p className="text-sm text-slate-300">
              Day 3: {campaign.followUps.day3.enabled ? campaign.followUps.day3.subject : 'Off'}
            </p>
            <p className="text-sm text-slate-300">
              Day 7: {campaign.followUps.day7.enabled ? campaign.followUps.day7.subject : 'Off'}
            </p>
          </div>

          {leads.length === 0 ? (
            <p className="rounded-lg border border-dashed border-graphite-600 px-4 py-8 text-center text-sm text-slate-400">
              No leads in this campaign.
            </p>
          ) : (
            <CampaignLeadsTable leads={leads} />
          )}
        </>
      )}
    </div>
  )
}
