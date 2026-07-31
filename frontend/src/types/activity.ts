export type ActivityKind = 'sent' | 'opened' | 'replied' | 'follow_up' | 'converted'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  label: string
  timestamp: string
}
