import { useEffect, useState } from 'react'
import { fetchNotificationSettings, saveNotificationSettings, testSlackWebhook } from '../../lib/mock/notifications'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { Switch } from '../ui/Switch'
import type { NotificationSettings } from '../../types/notification'

const EMPTY: NotificationSettings = { slackEnabled: false, slackWebhookUrl: '', emailAlertsEnabled: true }

export function NotificationSettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<NotificationSettings>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [savedJustNow, setSavedJustNow] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    setTestResult(null)
    setSavedJustNow(false)
    fetchNotificationSettings().then((result) => {
      setSettings(result)
      setIsLoading(false)
    })
  }, [open])

  async function handleTest() {
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await testSlackWebhook(settings.slackWebhookUrl)
      setTestResult(result)
    } finally {
      setIsTesting(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    setSavedJustNow(false)
    try {
      const saved = await saveNotificationSettings(settings)
      setSettings(saved)
      setSavedJustNow(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Notification settings">
      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-lg border border-graphite-700 p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-medium text-fog-50">Slack alerts</p>
              <Switch
                checked={settings.slackEnabled}
                onChange={(slackEnabled) => setSettings({ ...settings, slackEnabled })}
                label={settings.slackEnabled ? 'On' : 'Off'}
              />
            </div>
            <TextField
              label="Webhook URL"
              placeholder="https://hooks.slack.com/services/…"
              value={settings.slackWebhookUrl}
              onChange={(event) => setSettings({ ...settings, slackWebhookUrl: event.target.value })}
              disabled={!settings.slackEnabled}
            />
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleTest}
                isLoading={isTesting}
                disabled={!settings.slackEnabled || !settings.slackWebhookUrl.trim()}
              >
                Send test alert
              </Button>
              {testResult && (
                <p className={`text-xs ${testResult.success ? 'text-fog-100' : 'text-temp-hot'}`}>{testResult.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-graphite-700 p-4">
            <div>
              <p className="font-display text-sm font-medium text-fog-50">Email alerts</p>
              <p className="text-xs text-slate-400">Get an email when a lead replies.</p>
            </div>
            <Switch
              checked={settings.emailAlertsEnabled}
              onChange={(emailAlertsEnabled) => setSettings({ ...settings, emailAlertsEnabled })}
              label={settings.emailAlertsEnabled ? 'On' : 'Off'}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} isLoading={isSaving}>
              Save settings
            </Button>
            {savedJustNow && <p className="text-xs text-slate-400">Saved.</p>}
          </div>
        </div>
      )}
    </Drawer>
  )
}
