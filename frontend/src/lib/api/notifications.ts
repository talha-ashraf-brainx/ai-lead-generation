import { apiFetch } from './client'
import type { AppNotification, NotificationSettings } from '../../types/notification'

export async function fetchNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>('/api/notifications')
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  return apiFetch<AppNotification>(`/api/notifications/${id}/read`, { method: 'POST' })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/api/notifications/read-all', { method: 'POST' })
}

export async function clearNotifications(): Promise<void> {
  await apiFetch('/api/notifications', { method: 'DELETE' })
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/api/notifications/settings')
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/api/notifications/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export async function testSlackWebhook(url: string): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/notifications/settings/test-slack', {
    method: 'POST',
    body: JSON.stringify({ webhookUrl: url }),
  })
}
