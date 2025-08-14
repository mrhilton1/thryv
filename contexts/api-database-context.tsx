"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import type {
  User,
  Initiative,
  Achievement,
  ConfigItem,
  FieldConfiguration,
  NavigationConfig,
  CreateInitiativeData,
  UpdateInitiativeData,
  CreateAchievementData,
  UpdateAchievementData,
  CreateConfigItemData,
  UpdateConfigItemData,
  UpdateFieldConfigurationData,
  CreateNavigationConfigData,
  UpdateNavigationConfigData,
} from "@/lib/database/schemas"

interface ApiDatabaseContextType {
  // Data
  users: User[]
  initiatives: Initiative[]
  achievements: Achievement[]
  navigationConfig: NavigationConfig[]
  configItems: {
    teams: ConfigItem[]
    businessImpacts: ConfigItem[]
    productAreas: ConfigItem[]
    processStages: ConfigItem[]
    priorities: ConfigItem[]
    statuses: ConfigItem[]
    gtmTypes: ConfigItem[]
  }
  allConfigItems: ConfigItem[]
  fieldConfigurations: {
    basicInformation: FieldConfiguration[]
    statusProgress: FieldConfiguration[]
    timelineDates: FieldConfiguration[]
    additionalDetails: FieldConfiguration[]
  }
  allFieldConfigurations: FieldConfiguration[]

  // State
  loading: boolean
  error: string | null
  isOptimisticUpdate: boolean

  // User methods
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  createUser: (userData: any) => Promise<void>
  deleteUser: (id: string) => Promise<void>

  // Initiative methods
  createInitiative: (initiative: CreateInitiativeData) => Promise<void>
  updateInitiative: (id: string, updates: UpdateInitiativeData) => Promise<void>
  deleteInitiative: (id: string) => Promise<void>

  // Achievement methods
  createAchievement: (achievement: CreateAchievementData) => Promise<Achievement>
  updateAchievement: (id: string, updates: UpdateAchievementData) => Promise<void>
  deleteAchievement: (id: string) => Promise<void>

  // Navigation methods
  createNavigationConfig: (config: CreateNavigationConfigData) => Promise<void>
  updateNavigationConfig: (id: string, updates: UpdateNavigationConfigData) => Promise<void>
  deleteNavigationConfig: (id: string) => Promise<void>
  reorderNavigationConfig: (updates: { id: string; sortOrder: number }[]) => Promise<void>

  // Config item methods
  createConfigItem: (item: CreateConfigItemData) => Promise<void>
  updateConfigItem: (id: string, updates: UpdateConfigItemData) => Promise<void>
  deleteConfigItem: (id: string) => Promise<void>
  reorderConfigItems: (category: string, updates: { id: string; sortOrder: number }[]) => Promise<void>

  // Field configuration methods
  updateFieldConfiguration: (id: string, updates: UpdateFieldConfigurationData) => Promise<void>
  reorderFieldConfigurations: (updates: { id: string; order: number }[]) => Promise<void>

  // Utility methods
  refreshData: () => Promise<void>
  loadData: (skipLoadingState?: boolean) => Promise<void>
}

const ApiDatabaseContext = createContext<ApiDatabaseContextType | undefined>(undefined)

export function ApiDatabaseProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig[]>([])
  const [configItems, setConfigItems] = useState<{
    teams: ConfigItem[]
    businessImpacts: ConfigItem[]
    productAreas: ConfigItem[]
    processStages: ConfigItem[]
    priorities: ConfigItem[]
    statuses: ConfigItem[]
    gtmTypes: ConfigItem[]
  }>({
    teams: [],
    businessImpacts: [],
    productAreas: [],
    processStages: [],
    priorities: [],
    statuses: [],
    gtmTypes: [],
  })
  const [allConfigItems, setAllConfigItems] = useState<ConfigItem[]>([])
  const [fieldConfigurations, setFieldConfigurations] = useState<{
    basicInformation: FieldConfiguration[]
    statusProgress: FieldConfiguration[]
    timelineDates: FieldConfiguration[]
    additionalDetails: FieldConfiguration[]
  }>({
    basicInformation: [],
    statusProgress: [],
    timelineDates: [],
    additionalDetails: [],
  })
  const [allFieldConfigurations, setAllFieldConfigurations] = useState<FieldConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false)

  const loadData = async (skipLoadingState = false) => {
    console.log("=== ApiDatabaseContext.loadData START ===")
    if (!skipLoadingState) {
      setLoading(true)
    }
    setError(null)

    try {
      console.log("Fetching all data via API...")
      const [
        usersData,
        initiativesData,
        achievementsData,
        navigationConfigData,
        allConfigItemsData,
        fieldConfigurationsData,
      ] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getInitiatives(),
        apiClient.getAchievements(),
        apiClient.getNavigationConfig(),
        apiClient.getConfigItems(),
        apiClient.getFieldConfigurations(),
      ])

      console.log("API responses received:", {
        users: usersData.length,
        initiatives: initiativesData.length,
        achievements: achievementsData.length,
        navigationConfig: navigationConfigData.length,
        configItems: allConfigItemsData.length,
        fieldConfigurations: fieldConfigurationsData.length,
      })

      setUsers(usersData)
      setInitiatives(initiativesData as Initiative[])
      setAchievements(achievementsData)
      setNavigationConfig(navigationConfigData)
      setAllConfigItems(allConfigItemsData)
      setAllFieldConfigurations(fieldConfigurationsData)

      // Group config items by category
      const groupedConfigItems = {
        teams: allConfigItemsData.filter((item) => item.category === "teams"),
        businessImpacts: allConfigItemsData.filter((item) => item.category === "business_impacts"),
        productAreas: allConfigItemsData.filter((item) => item.category === "product_areas"),
        processStages: allConfigItemsData.filter((item) => item.category === "process_stages"),
        priorities: allConfigItemsData.filter((item) => item.category === "priorities"),
        statuses: allConfigItemsData.filter((item) => item.category === "statuses"),
        gtmTypes: allConfigItemsData.filter((item) => item.category === "gtm_types"),
      }
      setConfigItems(groupedConfigItems)

      // Group field configurations by section
      const groupedFieldConfigurations = {
        basicInformation: fieldConfigurationsData.filter((item) => item.section === "basic_information"),
        statusProgress: fieldConfigurationsData.filter((item) => item.section === "status_progress"),
        timelineDates: fieldConfigurationsData.filter((item) => item.section === "timeline_dates"),
        additionalDetails: fieldConfigurationsData.filter((item) => item.section === "additional_details"),
      }
      setFieldConfigurations(groupedFieldConfigurations)

      console.log("Data loaded successfully")
    } catch (error: any) {
      console.error("Error loading data:", error)
      setError(error.message || "Failed to load data")
    } finally {
      setLoading(false)
      setIsOptimisticUpdate(false)
    }
    console.log("=== ApiDatabaseContext.loadData END ===")
  }

  const refreshData = async () => {
    await loadData()
  }

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // User methods
  const updateUser = async (id: string, updates: Partial<User>) => {
    console.log("=== Context.updateUser START ===")
    console.log("Updating user:", id, "with:", updates)

    try {
      await apiClient.updateUser(id, updates)
      console.log("User updated successfully, refreshing data...")
      await loadData()
      console.log("=== Context.updateUser END ===")
    } catch (error) {
      console.error("Error in updateUser:", error)
      throw error
    }
  }

  const createUser = async (userData: any) => {
    console.log("=== Context.createUser START ===")
    console.log("Creating user:", userData)

    try {
      await apiClient.createUser(userData)
      console.log("User created successfully, refreshing data...")
      await loadData()
      console.log("=== Context.createUser END ===")
    } catch (error) {
      console.error("Error in createUser:", error)
      throw error
    }
  }

  const deleteUser = async (id: string) => {
    console.log("=== Context.deleteUser START ===")
    console.log("Deleting user:", id)

    try {
      await apiClient.deleteUser(id)
      console.log("User deleted successfully, refreshing data...")
      await loadData()
      console.log("=== Context.deleteUser END ===")
    } catch (error) {
      console.error("Error in deleteUser:", error)
      throw error
    }
  }

  // Initiative methods
  const createInitiative = async (initiative: CreateInitiativeData) => {
    console.log("=== Context.createInitiative START ===")
    console.log("Creating initiative:", initiative)

    try {
      await apiClient.createInitiative(initiative)
      console.log("Initiative created successfully, refreshing data...")
      await loadData()
      console.log("=== Context.createInitiative END ===")
    } catch (error) {
      console.error("Error in createInitiative:", error)
      throw error
    }
  }

  const updateInitiative = async (id: string, updates: UpdateInitiativeData) => {
    console.log("=== Context.updateInitiative START ===")
    console.log("Updating initiative:", id, "with:", updates)

    try {
      await apiClient.updateInitiative(id, updates)
      console.log("Initiative updated successfully, refreshing data...")
      await loadData()
      console.log("=== Context.updateInitiative END ===")
    } catch (error) {
      console.error("Error in updateInitiative:", error)
      throw error
    }
  }

  const deleteInitiative = async (id: string) => {
    console.log("=== Context.deleteInitiative START ===")
    console.log("Deleting initiative:", id)

    try {
      await apiClient.deleteInitiative(id)
      console.log("Initiative deleted successfully, refreshing data...")
      await loadData()
      console.log("=== Context.deleteInitiative END ===")
    } catch (error) {
      console.error("Error in deleteInitiative:", error)
      throw error
    }
  }

  // Achievement methods
  const createAchievement = async (achievement: CreateAchievementData) => {
    console.log("🔥 === Context.createAchievement START ===")
    console.log("🔥 Creating achievement with data:", achievement)

    try {
      console.log("🔥 About to call apiClient.createAchievement...")
      const result = await apiClient.createAchievement(achievement)
      console.log("🔥 API client returned result:", result)

      console.log("🔥 Achievement created successfully, refreshing data...")
      await loadData()
      console.log("🔥 Data refresh completed")
      console.log("🔥 === Context.createAchievement END ===")

      return result
    } catch (error) {
      console.error("🔥 ❌ Error in createAchievement:", error)
      throw error
    }
  }

  const updateAchievement = async (id: string, updates: UpdateAchievementData) => {
    console.log("=== Context.updateAchievement START ===")
    console.log("Updating achievement:", id, "with:", updates)

    try {
      await apiClient.updateAchievement(id, updates)
      console.log("Achievement updated successfully, refreshing data...")
      await loadData()
      console.log("=== Context.updateAchievement END ===")
    } catch (error) {
      console.error("Error in updateAchievement:", error)
      throw error
    }
  }

  const deleteAchievement = async (id: string) => {
    console.log("=== Context.deleteAchievement START ===")
    console.log("Deleting achievement:", id)

    try {
      await apiClient.deleteAchievement(id)
      console.log("Achievement deleted successfully, refreshing data...")
      await loadData()
      console.log("=== Context.deleteAchievement END ===")
    } catch (error) {
      console.error("Error in deleteAchievement:", error)
      throw error
    }
  }

  // Navigation Config methods
  const createNavigationConfig = async (config: CreateNavigationConfigData) => {
    console.log("=== Context.createNavigationConfig START ===")
    console.log("Creating navigation config:", config)

    try {
      setIsOptimisticUpdate(true)
      await apiClient.createNavigationConfig(config)
      console.log("Navigation config created successfully, refreshing data...")
      await loadData(true)
      console.log("=== Context.createNavigationConfig END ===")
    } catch (error) {
      console.error("Error in createNavigationConfig:", error)
      setIsOptimisticUpdate(false)
      throw error
    }
  }

  const updateNavigationConfig = async (id: string, updates: UpdateNavigationConfigData) => {
    console.log("=== Context.updateNavigationConfig START ===")
    console.log("Updating navigation config:", id, "with:", updates)

    try {
      setIsOptimisticUpdate(true)

      // Apply optimistic update immediately
      setNavigationConfig((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))

      await apiClient.updateNavigationConfig(id, updates)
      console.log("Navigation config updated successfully")
      console.log("=== Context.updateNavigationConfig END ===")
    } catch (error) {
      console.error("Error in updateNavigationConfig:", error)
      setIsOptimisticUpdate(false)
      // Revert optimistic update on error
      await loadData(true)
      throw error
    } finally {
      setIsOptimisticUpdate(false)
    }
  }

  const deleteNavigationConfig = async (id: string) => {
    console.log("=== Context.deleteNavigationConfig START ===")
    console.log("Deleting navigation config:", id)

    try {
      setIsOptimisticUpdate(true)
      await apiClient.deleteNavigationConfig(id)
      console.log("Navigation config deleted successfully, refreshing data...")
      await loadData(true)
      console.log("=== Context.deleteNavigationConfig END ===")
    } catch (error) {
      console.error("Error in deleteNavigationConfig:", error)
      setIsOptimisticUpdate(false)
      throw error
    }
  }

  const reorderNavigationConfig = async (updates: { id: string; sortOrder: number }[]) => {
    console.log("=== Context.reorderNavigationConfig START ===")
    console.log("Reordering navigation config with updates:", updates)

    try {
      setIsOptimisticUpdate(true)

      // Apply optimistic update immediately
      const updatedConfig = [...navigationConfig]
      updates.forEach((update) => {
        const index = updatedConfig.findIndex((item) => item.id === update.id)
        if (index !== -1) {
          updatedConfig[index] = { ...updatedConfig[index], sortOrder: update.sortOrder }
        }
      })
      setNavigationConfig(updatedConfig.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))

      await apiClient.reorderNavigationConfig(updates)
      console.log("Navigation config reordered successfully")
      console.log("=== Context.reorderNavigationConfig END ===")
    } catch (error) {
      console.error("Error in reorderNavigationConfig:", error)
      setIsOptimisticUpdate(false)
      // Revert optimistic update on error
      await loadData(true)
      throw error
    } finally {
      setIsOptimisticUpdate(false)
    }
  }

  // Config Item methods
  const createConfigItem = async (item: CreateConfigItemData) => {
    console.log("=== Context.createConfigItem START ===")
    console.log("Creating config item:", item)

    try {
      await apiClient.createConfigItem(item)
      console.log("Config item created successfully, refreshing data...")
      await loadData()
      console.log("=== Context.createConfigItem END ===")
    } catch (error) {
      console.error("Error in createConfigItem:", error)
      throw error
    }
  }

  const updateConfigItem = async (id: string, updates: UpdateConfigItemData) => {
    console.log("=== Context.updateConfigItem START ===")
    console.log("Updating config item:", id, "with:", updates)

    try {
      await apiClient.updateConfigItem(id, updates)
      console.log("Config item updated successfully, refreshing data...")
      await loadData()
      console.log("=== Context.updateConfigItem END ===")
    } catch (error) {
      console.error("Error in updateConfigItem:", error)
      throw error
    }
  }

  const deleteConfigItem = async (id: string) => {
    console.log("=== Context.deleteConfigItem START ===")
    console.log("Deleting config item:", id)

    try {
      await apiClient.deleteConfigItem(id)
      console.log("Config item deleted successfully, refreshing data...")
      await loadData()
      console.log("=== Context.deleteConfigItem END ===")
    } catch (error) {
      console.error("Error in deleteConfigItem:", error)
      throw error
    }
  }

  const reorderConfigItems = async (category: string, updates: { id: string; sortOrder: number }[]) => {
    console.log("=== Context.reorderConfigItems START ===")
    console.log("Reordering config items for category:", category, "with updates:", updates)

    try {
      await apiClient.reorderConfigItems(category, updates)
      console.log("Config items reordered successfully, refreshing data...")
      await loadData()
      console.log("=== Context.reorderConfigItems END ===")
    } catch (error) {
      console.error("Error in reorderConfigItems:", error)
      throw error
    }
  }

  // Field Configuration methods
  const updateFieldConfiguration = async (id: string, updates: UpdateFieldConfigurationData) => {
    console.log("=== Context.updateFieldConfiguration START ===")
    console.log("Updating field configuration:", id, "with:", updates)

    try {
      await apiClient.updateFieldConfiguration(id, updates)
      console.log("Field configuration updated successfully, refreshing data...")
      await loadData()
      console.log("=== Context.updateFieldConfiguration END ===")
    } catch (error) {
      console.error("Error in updateFieldConfiguration:", error)
      throw error
    }
  }

  const reorderFieldConfigurations = async (updates: { id: string; order: number }[]) => {
    console.log("=== Context.reorderFieldConfigurations START ===")
    console.log("Reordering field configurations with updates:", updates)

    try {
      await apiClient.reorderFieldConfigurations(updates)
      console.log("Field configurations reordered successfully, refreshing data...")
      await loadData()
      console.log("=== Context.reorderFieldConfigurations END ===")
    } catch (error) {
      console.error("Error in reorderFieldConfigurations:", error)
      throw error
    }
  }

  const value: ApiDatabaseContextType = {
    // Data
    users,
    initiatives,
    achievements,
    navigationConfig,
    configItems,
    allConfigItems,
    fieldConfigurations,
    allFieldConfigurations,

    // State
    loading,
    error,
    isOptimisticUpdate,

    // User methods
    updateUser,
    createUser,
    deleteUser,

    // Initiative methods
    createInitiative,
    updateInitiative,
    deleteInitiative,

    // Achievement methods
    createAchievement,
    updateAchievement,
    deleteAchievement,

    // Navigation methods
    createNavigationConfig,
    updateNavigationConfig,
    deleteNavigationConfig,
    reorderNavigationConfig,

    // Config item methods
    createConfigItem,
    updateConfigItem,
    deleteConfigItem,
    reorderConfigItems,

    // Field configuration methods
    updateFieldConfiguration,
    reorderFieldConfigurations,

    // Utility methods
    refreshData,
    loadData,
  }

  return <ApiDatabaseContext.Provider value={value}>{children}</ApiDatabaseContext.Provider>
}

export function useApiDatabase() {
  const context = useContext(ApiDatabaseContext)
  if (context === undefined) {
    throw new Error("useApiDatabase must be used within an ApiDatabaseProvider")
  }
  return context
}

// Export with the same name for easy replacement
export { useApiDatabase as useSupabaseDatabase, ApiDatabaseProvider as SupabaseDatabaseProvider }