import { useState } from 'react'
import { API_KEY_PROVIDERS, saveApiKey } from '../../lib/api/settings'
import { SettingsSection } from './SettingsSection'
import { Button } from '../ui/Button'
import { SecretField } from '../ui/SecretField'
import { Skeleton } from '../ui/Skeleton'
import type { ApiKeyProvider, ApiKeyStatus } from '../../types/settings'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

interface ApiKeysSectionProps {
  statuses: ApiKeyStatus[]
  isLoading: boolean
  onSave: (status: ApiKeyStatus) => void
}

export function ApiKeysSection({ statuses, isLoading, onSave }: ApiKeysSectionProps) {
  const [drafts, setDrafts] = useState<Record<ApiKeyProvider, string>>({
    apollo: '',
    hunter: '',
    openai: '',
    resend: '',
  })
  const [savingProvider, setSavingProvider] = useState<ApiKeyProvider | null>(null)

  async function handleSave(provider: ApiKeyProvider) {
    const value = drafts[provider].trim()
    if (!value) return
    setSavingProvider(provider)
    try {
      const updated = await saveApiKey(provider, value)
      onSave(updated)
      setDrafts((current) => ({ ...current, [provider]: '' }))
    } finally {
      setSavingProvider(null)
    }
  }

  return (
    <SettingsSection title="API keys" description="Connect the services that power enrichment, generation, and sending.">
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {API_KEY_PROVIDERS.map(({ id, label, hint }) => {
            const status = statuses.find((entry) => entry.provider === id)
            const draft = drafts[id]
            return (
              <div key={id} className="flex flex-col gap-3 rounded-lg border border-graphite-700 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-medium text-fog-50">{label}</p>
                    <p className="text-xs text-slate-400">{hint}</p>
                  </div>
                  {status?.connected ? (
                    <span className="flex items-center gap-1.5 font-mono text-xs text-temp-cold">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      Connected · {status.maskedValue}
                      {status.updatedAt && ` · ${formatDate(status.updatedAt)}`}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-slate-500">Not connected</span>
                  )}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-48 flex-1">
                    <SecretField
                      label={status?.connected ? 'Replace key' : 'API key'}
                      placeholder="Paste key"
                      value={draft}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [id]: event.target.value }))
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleSave(id)}
                    disabled={!draft.trim() || savingProvider === id}
                    isLoading={savingProvider === id}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SettingsSection>
  )
}
