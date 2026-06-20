'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { auth, type AuthUser } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface AuthCtx {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('gitspan_token')
    if (!token) { setLoading(false); return }
    auth.me()
      .then(setUser)
      .catch(() => { localStorage.removeItem('gitspan_token') })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await auth.login(email, password)
    localStorage.setItem('gitspan_token', data.access_token)
    setUser(data)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await auth.register(name, email, password)
    localStorage.setItem('gitspan_token', data.access_token)
    setUser(data)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gitspan_token')
    setUser(null)
    router.push('/login')
  }, [router])

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
