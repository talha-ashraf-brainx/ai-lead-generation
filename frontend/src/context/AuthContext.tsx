import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../types/auth'
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../lib/api/auth'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsInitializing(false))
  }, [])

  async function login(email: string, password: string) {
    const loggedInUser = await apiLogin(email, password)
    setUser(loggedInUser)
  }

  async function logout() {
    try {
      await apiLogout()
    } finally {
      setUser(null)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isInitializing, login, logout }),
    [user, isInitializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
