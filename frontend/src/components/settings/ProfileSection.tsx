import { useEffect, useState } from 'react'
import { fetchProfile, saveProfile } from '../../lib/mock/settings'
import { SettingsSection } from './SettingsSection'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { Skeleton } from '../ui/Skeleton'
import type { ProfileSettings } from '../../types/settings'

export function ProfileSection() {
  const [saved, setSaved] = useState<ProfileSettings | null>(null)
  const [draft, setDraft] = useState<ProfileSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfile().then((result) => {
      setSaved(result)
      setDraft(result)
    })
  }, [])

  const isDirty = saved !== null && draft !== null && (draft.name !== saved.name || draft.email !== saved.email)

  async function handleSave() {
    if (!draft) return
    setIsSaving(true)
    try {
      const result = await saveProfile(draft)
      setSaved(result)
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    if (saved) setDraft(saved)
  }

  return (
    <SettingsSection title="Profile" description="Your account name and email.">
      {!draft ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <TextField
              label="Email"
              type="email"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
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
