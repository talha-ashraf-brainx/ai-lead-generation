import { useState } from 'react'
import { API_KEY_PROVIDERS, deleteAllData, disconnectApiKey } from '../../lib/api/settings'
import { SettingsSection } from './SettingsSection'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import type { ApiKeyProvider, ApiKeyStatus } from '../../types/settings'

const PROVIDER_LABEL: Record<ApiKeyProvider, string> = Object.fromEntries(
  API_KEY_PROVIDERS.map(({ id, label }) => [id, label]),
) as Record<ApiKeyProvider, string>

interface DangerZoneSectionProps {
  statuses: ApiKeyStatus[]
  onDisconnect: (provider: ApiKeyProvider) => void
}

export function DangerZoneSection({ statuses, onDisconnect }: DangerZoneSectionProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const connected = statuses.filter((status) => status.connected)

  async function handleDisconnect(provider: ApiKeyProvider) {
    if (!confirm(`Disconnect ${PROVIDER_LABEL[provider]}? You'll need to re-enter the key to reconnect.`)) return
    await disconnectApiKey(provider)
    onDisconnect(provider)
  }

  async function handleDeleteAll() {
    setIsDeleting(true)
    try {
      await deleteAllData()
      window.location.reload()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SettingsSection title="Danger zone" description="Destructive actions — these can't be undone.">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">Connected integrations</p>
        {connected.length === 0 ? (
          <p className="text-sm text-slate-500">No integrations connected.</p>
        ) : (
          connected.map((status) => (
            <div
              key={status.provider}
              className="flex items-center justify-between rounded-md border border-graphite-700 px-3 py-2.5"
            >
              <span className="text-sm text-fog-100">{PROVIDER_LABEL[status.provider]}</span>
              <Button
                variant="ghost"
                onClick={() => handleDisconnect(status.provider)}
                className="border-temp-hot/40 text-temp-hot hover:bg-temp-hot/10"
              >
                Disconnect
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-temp-hot/30 bg-temp-hot/5 p-4">
        <div>
          <p className="font-display text-sm font-medium text-fog-50">Delete all data</p>
          <p className="mt-1 text-xs text-slate-400">
            Permanently deletes every lead, campaign, email draft, and setting.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <TextField
              label="Type DELETE to confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="DELETE"
            />
          </div>
          <Button
            onClick={handleDeleteAll}
            disabled={confirmText !== 'DELETE' || isDeleting}
            isLoading={isDeleting}
            className="bg-temp-hot hover:bg-temp-hot/90"
          >
            Delete everything
          </Button>
        </div>
      </div>
    </SettingsSection>
  )
}
