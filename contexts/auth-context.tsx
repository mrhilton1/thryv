"use client"

import React, { createContext, useContext, useState } from 'react'
import { User } from '@/lib/database/schemas'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'Bob Hope',
    email: 'bob.hope@company.com',
    role: 'admin',
    avatar: '/placeholder.svg?height=32&width=32',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const login = async (email: string, password: string) => {
    // Mock login
    setUser({
      id: '1',
      name: 'Bob Hope',
      email: email,
      role: 'admin',
      avatar: '/placeholder.svg?height=32&width=32',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  const logout = () => {
    setUser(null)
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    
    switch (permission) {
      case 'read':
        return true
      case 'write':
        return user.role === 'admin' || user.role === 'editor'
      case 'manage-users':
        return user.role === 'admin'
      case 'export':
        return user.role === 'admin' || user.role === 'editor'
      default:
        return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
