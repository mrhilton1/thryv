"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useSupabaseDatabase } from "./supabase-database-context"

interface AdminConfig {
  teams: Array<{ id: string; label: string; color?: string }>
  businessImpacts: Array<{ id: string; label: string; color?: string }>
  productAreas: Array<{ id: string; label: string; color?: string }>
  processStages: Array<{ id: string; label: string; color?: string }>
  priorities: Array<{ id: string; label: string; color?: string }>
  statuses: Array<{ id: string; label: string; color?: string }>
  gtmTypes: Array<{ id: string; label: string; color?: string }>
}

interface AdminContextType {
  config: AdminConfig
  loading: boolean
  error: string | null
  refreshConfig: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { configItems } = useSupabaseDatabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Transform config items into the expected format
  const config: AdminConfig = {
    teams:
      configItems?.teams?.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
      })) || [],
    businessImpacts:
      configItems?.businessImpacts?.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
      })) || [],
    productAreas:
      configItems?.productAreas?.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
      })) || [],
    processStages:
      configItems?.processStages?.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
      })) || [],
    priorities:
      configItems?.priorities?.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
      })) || [],
    statuses:
      configItems?.statuses?.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
      })) || [],
    gtmTypes:
      configItems?.gtmTypes?.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
      })) || [],
  }

  const refreshConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      // Config is automatically refreshed through the database context
    } catch (err) {
      console.error("Error refreshing admin config:", err)
      setError(err instanceof Error ? err.message : "Failed to refresh config")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Set loading to false once we have config items
    if (configItems) {
      setLoading(false)
    }
  }, [configItems])

  const value: AdminContextType = {
    config,
    loading,
    error,
    refreshConfig,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
