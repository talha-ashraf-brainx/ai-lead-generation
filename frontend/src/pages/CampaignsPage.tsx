import { EmptyState } from '../components/ui/EmptyState'
import { IconCampaigns } from '../components/ui/icons'

export function CampaignsPage() {
  return (
    <EmptyState
      icon={<IconCampaigns className="h-8 w-8" />}
      title="Campaigns arrive in Phase 6"
      description="Select leads, review generated emails, and configure follow-up sequences from here once the campaigns module is built."
    />
  )
}
