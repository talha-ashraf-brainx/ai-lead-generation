import { EmptyState } from '../components/ui/EmptyState'
import { IconSettings } from '../components/ui/icons'

export function SettingsPage() {
  return (
    <EmptyState
      icon={<IconSettings className="h-8 w-8" />}
      title="Settings arrive in Phase 10"
      description="API key management, sender identity, and account settings will live here."
    />
  )
}
