import { apiFetch } from './client'
import type { User } from '../../types/auth'

export async function login(email: string, password: string): Promise<User> {
  const { user } = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return user
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  const { user } = await apiFetch<{ user: User; token: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  return user
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/api/auth/logout', { method: 'POST' })
}

export async function fetchCurrentUser(): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/api/auth/me')
  return user
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
