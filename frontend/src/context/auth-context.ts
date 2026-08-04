import { createContext } from 'react'
import type { User } from '../types/auth'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
