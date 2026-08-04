import { useEffect, useState } from 'react'
import { fetchApiKeyStatuses } from '../lib/api/settings'
import { ApiKeysSection } from '../components/settings/ApiKeysSection'
import { SenderIdentitySection } from '../components/settings/SenderIdentitySection'
import { ProfileSection } from '../components/settings/ProfileSection'
import { DangerZoneSection } from '../components/settings/DangerZoneSection'
import type { ApiKeyProvider, ApiKeyStatus } from '../types/settings'

export function SettingsPage() {
  const [statuses, setStatuses] = useState<ApiKeyStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchApiKeyStatuses().then((result) => {
      setStatuses(result)
      setIsLoading(false)
    })
  }, [])

  function handleSave(next: ApiKeyStatus) {
    setStatuses((current) => current.map((status) => (status.provider === next.provider ? next : status)))
  }

  function handleDisconnect(provider: ApiKeyProvider) {
    setStatuses((current) =>
      current.map((status) =>
        status.provider === provider ? { ...status, connected: false, maskedValue: null, updatedAt: null } : status,
      ),
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-medium text-fog-50">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">Manage integrations, sender identity, and your account.</p>
      </div>

      <ApiKeysSection statuses={statuses} isLoading={isLoading} onSave={handleSave} />
      <SenderIdentitySection />
      <ProfileSection />
      <DangerZoneSection statuses={statuses} onDisconnect={handleDisconnect} />
    </div>
  )
}
