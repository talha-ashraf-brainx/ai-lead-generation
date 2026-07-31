import { listLeadsByStatuses } from './leads'
import type { AppNotification, NotificationSettings } from '../../types/notification'

// Prototype-only mock backend. Mirrors the future reply-detection + alerting
// endpoint (SendGrid inbound parse -> Slack webhook / email via Nodemailer).

const NOTIFICATIONS_KEY = 'emberline.notifications.v1'
const SETTINGS_KEY = 'emberline.notification-settings.v1'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function seedNotifications(): AppNotification[] {
  const leads = listLeadsByStatuses(['replied', 'converted']).slice(0, 14)
  const now = Date.now()

  return leads.map((lead, index) => {
    const isConversion = lead.status === 'converted'
    return {
      id: makeId(),
      kind: isConversion ? 'conversion' : 'reply',
      title: isConversion ? `${lead.company} converted` : `${lead.contactName} replied`,
      detail: isConversion
        ? `${lead.company} was marked as converted${lead.campaignName ? ` in ${lead.campaignName}` : ''}.`
        : `${lead.contactName} at ${lead.company} replied to your outreach${
            lead.campaignName ? ` (${lead.campaignName})` : ''
          }.`,
      leadId: lead.id,
      campaignId: lead.campaignId,
      createdAt: new Date(now - index * 3.2 * 3_600_000).toISOString(),
      read: index > 3,
    }
  })
}

let cache: AppNotification[] | null = null

function readStore(): AppNotification[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    if (raw) {
      cache = JSON.parse(raw) as AppNotification[]
      return cache
    }
  } catch {
    // fall through to reseed on corrupt storage
  }
  cache = seedNotifications()
  writeStore(cache)
  return cache
}

function writeStore(notifications: AppNotification[]) {
  cache = notifications
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  notifyListeners()
}

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeToNotifications(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  await delay(250)
  return [...readStore()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function markNotificationRead(id: string): Promise<void> {
  writeStore(readStore().map((notification) => (notification.id === id ? { ...notification, read: true } : notification)))
}

export async function markAllNotificationsRead(): Promise<void> {
  writeStore(readStore().map((notification) => ({ ...notification, read: true })))
}

export async function clearNotifications(): Promise<void> {
  writeStore([])
}

const DEFAULT_SETTINGS: NotificationSettings = {
  slackEnabled: false,
  slackWebhookUrl: '',
  emailAlertsEnabled: true,
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  await delay(200)
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as NotificationSettings) }
  } catch {
    // fall through to defaults on corrupt storage
  }
  return DEFAULT_SETTINGS
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
  await delay(400)
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  return settings
}

export async function testSlackWebhook(url: string): Promise<{ success: boolean; message: string }> {
  await delay(700)
  const trimmed = url.trim()
  if (!/^https:\/\/hooks\.slack\.com\/services\//.test(trimmed)) {
    return { success: false, message: "That doesn't look like a Slack webhook URL." }
  }
  return { success: true, message: 'Test alert sent — check your Slack channel.' }
}
