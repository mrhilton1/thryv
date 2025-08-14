"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/database/schemas'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return
      const authUser = data.user
      if (!authUser) {
        setUser(null)
        return
      }
      // Load profile to get role/name
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
      setUser(
        profile
          ? {
              id: profile.id,
              name: profile.full_name || profile.username || authUser.email || 'User',
              email: authUser.email || '',
              role: profile.role || 'user',
              avatar: profile.avatar_url || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : {
              id: authUser.id,
              name: authUser.email || 'User',
              email: authUser.email || '',
              role: 'user',
              avatar: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
      )
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null)
        return
      }
      const authUser = session.user
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
      setUser(
        profile
          ? {
              id: profile.id,
              name: profile.full_name || profile.username || authUser.email || 'User',
              email: authUser.email || '',
              role: profile.role || 'user',
              avatar: profile.avatar_url || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : {
              id: authUser.id,
              name: authUser.email || 'User',
              email: authUser.email || '',
              role: 'user',
              avatar: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
      )
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    switch (permission) {
      case 'read':
        return true
      case 'write':
        return user.role === 'admin' || user.role === 'executive' || user.role === 'manager'
      case 'manage-users':
        return user.role === 'admin'
      case 'export':
        return user.role !== 'user'
      default:
        return false
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, hasPermission }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
