import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { fetchCampaigns, subscribeToCampaigns } from '../../lib/mock/campaigns'
import { Button } from '../../components/ui/Button'
import { CampaignStatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { staggerContainer, staggerRow } from '../../lib/motion'
import { IconCampaigns, IconChevronRight, IconPlus } from '../../components/ui/icons'
import type { Campaign, CampaignStatus } from '../../types/campaign'

const STATUS_ACCENT: Record<CampaignStatus, string> = {
  draft: 'var(--color-slate-500)',
  sending: 'var(--color-primary)',
  active: 'var(--color-primary)',
  completed: 'var(--color-slate-500)',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    function load() {
      fetchCampaigns().then((result) => {
        if (!cancelled) {
          setCampaigns(result)
          setIsLoading(false)
        }
      })
    }
    load()
    const unsubscribe = subscribeToCampaigns(load)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-fog-50">Campaigns</h2>
          <p className="mt-1 text-sm text-slate-400">
            {isLoading ? 'Loading campaigns…' : `${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link to="/campaigns/new">
          <Button className="gap-2">
            <IconPlus className="h-4 w-4" />
            New campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<IconCampaigns className="h-8 w-8" />}
          title="No campaigns yet"
          description="Select leads, review generated emails, and configure follow-ups to launch your first campaign."
          action={
            <Link to="/campaigns/new">
              <Button className="gap-2">
                <IconPlus className="h-4 w-4" />
                New campaign
              </Button>
            </Link>
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {campaigns.map((campaign) => (
            <motion.div key={campaign.id} variants={staggerRow}>
              <Link
                to={`/campaigns/${campaign.id}`}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-graphite-700 bg-graphite-900 p-5 transition-colors hover:border-graphite-600 hover:bg-graphite-800/60"
              >
                <span
                  className="absolute inset-y-0 left-0 w-0.5"
                  style={{ background: STATUS_ACCENT[campaign.status] }}
                />
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-base font-medium text-fog-50">{campaign.name}</p>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  <p className="mt-3 font-mono text-3xl font-medium tracking-tight text-fog-50 tabular-nums">
                    {campaign.leadIds.length}
                  </p>
                  <p className="text-xs text-slate-500">lead{campaign.leadIds.length === 1 ? '' : 's'}</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Created {formatDate(campaign.createdAt)}</span>
                  <IconChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
