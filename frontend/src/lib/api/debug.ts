import { apiFetch } from './client'

export interface DebugLogEntry {
  id: number
  timestamp: string
  level: 'warn' | 'error'
  message: string
  meta?: Record<string, unknown>
}

export async function fetchDebugStatus(): Promise<{ enabled: boolean }> {
  return apiFetch('/api/debug/status')
}

export async function fetchDebugLog(): Promise<DebugLogEntry[]> {
  return apiFetch('/api/debug/log')
}
