import { apiFetch } from './client'
import type { ApiKeyProvider, ApiKeyStatus, ProfileSettings, SenderIdentity } from '../../types/settings'

export const API_KEY_PROVIDERS: { id: ApiKeyProvider; label: string; hint: string }[] = [
  { id: 'apollo', label: 'Apollo.io', hint: 'Lead enrichment' },
  { id: 'hunter', label: 'Hunter.io', hint: 'Email finding (enrichment fallback)' },
  { id: 'openai', label: 'OpenAI', hint: 'AI email generation (GPT-4)' },
  { id: 'sendgrid', label: 'SendGrid', hint: 'Email sending + open/reply tracking' },
]

export async function fetchApiKeyStatuses(): Promise<ApiKeyStatus[]> {
  return apiFetch<ApiKeyStatus[]>('/api/settings/api-keys')
}

export async function saveApiKey(provider: ApiKeyProvider, rawValue: string): Promise<ApiKeyStatus> {
  return apiFetch<ApiKeyStatus>(`/api/settings/api-keys/${provider}`, {
    method: 'PUT',
    body: JSON.stringify({ value: rawValue }),
  })
}

export async function disconnectApiKey(provider: ApiKeyProvider): Promise<void> {
  await apiFetch(`/api/settings/api-keys/${provider}`, { method: 'DELETE' })
}

export async function fetchSenderIdentity(): Promise<SenderIdentity> {
  return apiFetch<SenderIdentity>('/api/settings/sender-identity')
}

export async function saveSenderIdentity(identity: SenderIdentity): Promise<SenderIdentity> {
  return apiFetch<SenderIdentity>('/api/settings/sender-identity', {
    method: 'PUT',
    body: JSON.stringify(identity),
  })
}

export async function fetchProfile(): Promise<ProfileSettings> {
  return apiFetch<ProfileSettings>('/api/settings/profile')
}

export async function saveProfile(profile: ProfileSettings): Promise<ProfileSettings> {
  return apiFetch<ProfileSettings>('/api/settings/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

export async function deleteAllData(): Promise<void> {
  await apiFetch('/api/settings/data', { method: 'DELETE' })
}
