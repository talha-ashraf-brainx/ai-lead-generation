import type { User } from '../../types/auth'

// Prototype-only mock backend. Function signatures mirror what the real
// API client will expose, so pages don't change when a real backend lands.

export const DEMO_CREDENTIALS = { email: 'demo@leadgen.ai', password: 'outreach123' }

const DEMO_USER: User = {
  id: 'usr_demo',
  name: 'Jordan Ellis',
  email: DEMO_CREDENTIALS.email,
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin(email: string, password: string): Promise<User> {
  await delay(500)
  if (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  ) {
    return DEMO_USER
  }
  throw new Error('Invalid email or password')
}

export async function mockRequestPasswordReset(email: string): Promise<void> {
  await delay(400)
  if (!email.includes('@')) {
    throw new Error('Enter a valid email address')
  }
}
