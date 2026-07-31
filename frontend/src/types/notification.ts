export type NotificationKind = 'reply' | 'follow_up' | 'conversion'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  detail: string
  leadId: string | null
  campaignId: string | null
  createdAt: string
  read: boolean
}

export interface NotificationSettings {
  slackEnabled: boolean
  slackWebhookUrl: string
  emailAlertsEnabled: boolean
}
