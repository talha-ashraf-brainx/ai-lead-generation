import { EmptyState } from '../components/ui/EmptyState'
import { IconAnalytics } from '../components/ui/icons'

export function AnalyticsPage() {
  return (
    <EmptyState
      icon={<IconAnalytics className="h-8 w-8" />}
      title="Analytics arrive in Phase 9"
      description="Open rate, reply rate, conversion rate, and per-campaign breakdowns will live here."
    />
  )
}
