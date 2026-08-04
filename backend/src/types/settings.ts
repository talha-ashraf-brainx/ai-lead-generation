export const API_KEY_PROVIDERS = ["apollo", "hunter", "openai", "sendgrid"] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

export interface ApiKeyStatus {
  provider: ApiKeyProvider;
  connected: boolean;
  maskedValue: string | null;
  updatedAt: string | null;
}

export interface SenderIdentity {
  fromName: string;
  fromEmail: string;
  smtpFallbackEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
}

export interface ProfileSettings {
  name: string;
  email: string;
}
