import { useEffect, useState } from 'react'
import { fetchSenderIdentity, saveSenderIdentity } from '../../lib/api/settings'
import { SettingsSection } from './SettingsSection'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { SecretField } from '../ui/SecretField'
import { Switch } from '../ui/Switch'
import { Skeleton } from '../ui/Skeleton'
import type { SenderIdentity } from '../../types/settings'

function isEqual(a: SenderIdentity, b: SenderIdentity): boolean {
  return (
    a.fromName === b.fromName &&
    a.fromEmail === b.fromEmail &&
    a.smtpFallbackEnabled === b.smtpFallbackEnabled &&
    a.smtpHost === b.smtpHost &&
    a.smtpPort === b.smtpPort &&
    a.smtpUsername === b.smtpUsername &&
    a.smtpPassword === b.smtpPassword
  )
}

export function SenderIdentitySection() {
  const [saved, setSaved] = useState<SenderIdentity | null>(null)
  const [draft, setDraft] = useState<SenderIdentity | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSenderIdentity().then((result) => {
      setSaved(result)
      setDraft(result)
    })
  }, [])

  const isDirty = saved !== null && draft !== null && !isEqual(saved, draft)

  async function handleSave() {
    if (!draft) return
    setIsSaving(true)
    try {
      const result = await saveSenderIdentity(draft)
      setSaved(result)
      setDraft(result)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    if (saved) setDraft(saved)
  }

  return (
    <SettingsSection title="Sender identity" description="The from name/address used when sending campaigns.">
      {!draft ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="From name"
              value={draft.fromName}
              onChange={(event) => setDraft({ ...draft, fromName: event.target.value })}
            />
            <TextField
              label="From email"
              type="email"
              value={draft.fromEmail}
              onChange={(event) => setDraft({ ...draft, fromEmail: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-graphite-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-medium text-fog-50">Use custom SMTP</p>
                <p className="text-xs text-slate-400">Fallback if Resend is unavailable.</p>
              </div>
              <Switch
                checked={draft.smtpFallbackEnabled}
                onChange={(smtpFallbackEnabled) => setDraft({ ...draft, smtpFallbackEnabled })}
                label={draft.smtpFallbackEnabled ? 'On' : 'Off'}
              />
            </div>
            {draft.smtpFallbackEnabled && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="SMTP host"
                  value={draft.smtpHost}
                  onChange={(event) => setDraft({ ...draft, smtpHost: event.target.value })}
                />
                <TextField
                  label="SMTP port"
                  value={draft.smtpPort}
                  onChange={(event) => setDraft({ ...draft, smtpPort: event.target.value })}
                />
                <TextField
                  label="SMTP username"
                  value={draft.smtpUsername}
                  onChange={(event) => setDraft({ ...draft, smtpUsername: event.target.value })}
                />
                <SecretField
                  label="SMTP password"
                  value={draft.smtpPassword}
                  onChange={(event) => setDraft({ ...draft, smtpPassword: event.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!isDirty} isLoading={isSaving}>
              Save
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={!isDirty}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </SettingsSection>
  )
}
