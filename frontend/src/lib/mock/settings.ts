import { DEMO_USER } from './auth'
import type { ApiKeyProvider, ApiKeyStatus, ProfileSettings, SenderIdentity } from '../../types/settings'

// Prototype-only mock backend. Real keys are never sent to a server here — just
// localStorage — but the fetch layer still only ever returns masked values,
// mirroring how a real API would behave (write-only secrets).

const API_KEYS_KEY = 'emberline.api-keys.v1'
const SENDER_IDENTITY_KEY = 'emberline.sender-identity.v1'
const PROFILE_KEY = 'emberline.profile.v1'

export const API_KEY_PROVIDERS: { id: ApiKeyProvider; label: string; hint: string }[] = [
  { id: 'apollo', label: 'Apollo.io', hint: 'Lead enrichment' },
  { id: 'hunter', label: 'Hunter.io', hint: 'Email finding (enrichment fallback)' },
  { id: 'openai', label: 'OpenAI', hint: 'AI email generation (GPT-4)' },
  { id: 'sendgrid', label: 'SendGrid', hint: 'Email sending + open/reply tracking' },
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mask(rawValue: string): string {
  return `••••••••${rawValue.slice(-4)}`
}

type ApiKeyStore = Partial<Record<ApiKeyProvider, { raw: string; updatedAt: string }>>

function readApiKeyStore(): ApiKeyStore {
  try {
    const raw = localStorage.getItem(API_KEYS_KEY)
    return raw ? (JSON.parse(raw) as ApiKeyStore) : {}
  } catch {
    return {}
  }
}

function writeApiKeyStore(store: ApiKeyStore) {
  localStorage.setItem(API_KEYS_KEY, JSON.stringify(store))
}

export async function fetchApiKeyStatuses(): Promise<ApiKeyStatus[]> {
  await delay(300)
  const store = readApiKeyStore()
  return API_KEY_PROVIDERS.map(({ id }) => {
    const entry = store[id]
    return {
      provider: id,
      connected: Boolean(entry),
      maskedValue: entry ? mask(entry.raw) : null,
      updatedAt: entry?.updatedAt ?? null,
    }
  })
}

export async function saveApiKey(provider: ApiKeyProvider, rawValue: string): Promise<ApiKeyStatus> {
  await delay(500)
  const store = readApiKeyStore()
  const updatedAt = new Date().toISOString()
  store[provider] = { raw: rawValue, updatedAt }
  writeApiKeyStore(store)
  return { provider, connected: true, maskedValue: mask(rawValue), updatedAt }
}

export async function disconnectApiKey(provider: ApiKeyProvider): Promise<void> {
  await delay(300)
  const store = readApiKeyStore()
  delete store[provider]
  writeApiKeyStore(store)
}

const DEFAULT_SENDER_IDENTITY: SenderIdentity = {
  fromName: 'Emberline Outreach',
  fromEmail: 'outreach@emberline.io',
  smtpFallbackEnabled: false,
  smtpHost: '',
  smtpPort: '',
  smtpUsername: '',
  smtpPassword: '',
}

export async function fetchSenderIdentity(): Promise<SenderIdentity> {
  await delay(250)
  try {
    const raw = localStorage.getItem(SENDER_IDENTITY_KEY)
    if (raw) return { ...DEFAULT_SENDER_IDENTITY, ...(JSON.parse(raw) as SenderIdentity) }
  } catch {
    // fall through to defaults on corrupt storage
  }
  return DEFAULT_SENDER_IDENTITY
}

export async function saveSenderIdentity(identity: SenderIdentity): Promise<SenderIdentity> {
  await delay(400)
  localStorage.setItem(SENDER_IDENTITY_KEY, JSON.stringify(identity))
  return identity
}

const DEFAULT_PROFILE: ProfileSettings = { name: DEMO_USER.name, email: DEMO_USER.email }

export async function fetchProfile(): Promise<ProfileSettings> {
  await delay(200)
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw) as ProfileSettings
  } catch {
    // fall through to defaults on corrupt storage
  }
  return DEFAULT_PROFILE
}

export async function saveProfile(profile: ProfileSettings): Promise<ProfileSettings> {
  await delay(400)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

export async function deleteAllData(): Promise<void> {
  await delay(600)
  const keysToKeep = new Set(['emberline.auth.user'])
  Object.keys(localStorage)
    .filter((key) => key.startsWith('emberline.') && !keysToKeep.has(key))
    .forEach((key) => localStorage.removeItem(key))
}
