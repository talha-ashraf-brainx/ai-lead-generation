export type ApiKeyProvider = 'apollo' | 'hunter' | 'openai' | 'sendgrid'

export interface ApiKeyStatus {
  provider: ApiKeyProvider
  connected: boolean
  maskedValue: string | null
  updatedAt: string | null
}

export interface SenderIdentity {
  fromName: string
  fromEmail: string
  smtpFallbackEnabled: boolean
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpPassword: string
}

export interface ProfileSettings {
  name: string
  email: string
}
