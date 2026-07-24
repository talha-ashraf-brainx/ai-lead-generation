import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../types/auth'
import { mockLogin } from '../lib/mock/auth'
import { AuthContext, type AuthContextValue } from './auth-context'

const STORAGE_KEY = 'emberline.auth.user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsInitializing(false)
  }, [])

  async function login(email: string, password: string) {
    const loggedInUser = await mockLogin(email, password)
    setUser(loggedInUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isInitializing, login, logout }),
    [user, isInitializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
