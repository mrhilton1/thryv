"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { databaseService } from "@/lib/supabase/database-service"
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

interface SupabaseDatabaseContextType {
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

const SupabaseDatabaseContext = createContext<SupabaseDatabaseContextType | undefined>(undefined)

export function SupabaseDatabaseProvider({ children }: { children: React.ReactNode }) {
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

  const groupConfigItems = (items: ConfigItem[]) => {
    return {
      teams: items.filter((item) => item.category === "teams"),
      businessImpacts: items.filter((item) => item.category === "business_impacts"),
      productAreas: items.filter((item) => item.category === "product_areas"),
      processStages: items.filter((item) => item.category === "process_stages"),
      priorities: items.filter((item) => item.category === "priorities"),
      statuses: items.filter((item) => item.category === "statuses"),
      gtmTypes: items.filter((item) => item.category === "gtm_types"),
    }
  }

  const groupFieldConfigurations = (items: FieldConfiguration[]) => {
    return {
      basicInformation: items.filter((item) => item.sectionName === "basic_information"),
      statusProgress: items.filter((item) => item.sectionName === "status_progress"),
      timelineDates: items.filter((item) => item.sectionName === "timeline_dates"),
      additionalDetails: items.filter((item) => item.sectionName === "additional_details"),
    }
  }

  const loadData = async (skipLoadingState = false) => {
    try {
      console.log("=== SupabaseDatabaseContext.loadData START ===")
      if (!skipLoadingState) {
        setLoading(true)
      }
      setError(null)

      const [
        usersData,
        initiativesData,
        achievementsData,
        navigationConfigData,
        configItemsData,
        allConfigItemsData,
        fieldConfigurationsData,
      ] = await Promise.all([
        databaseService.getUsers(),
        databaseService.getInitiatives(),
        databaseService.getAchievements(),
        databaseService.getNavigationConfig(),
        databaseService.getConfigItems(),
        databaseService.getAllConfigItems(),
        databaseService.getFieldConfigurations(),
      ])

      console.log("Loaded users:", usersData)
      console.log("Loaded initiatives:", initiativesData)
      console.log("Loaded achievements:", achievementsData)
      console.log("🔍 ACHIEVEMENT DEBUGGING:")
      console.log("🔍 Total achievements loaded:", achievementsData.length)
      achievementsData.forEach((achievement, index) => {
        console.log(`🔍 Achievement ${index + 1}:`, {
          id: achievement.id,
          title: achievement.title,
          type: achievement.type,
          dateAchieved: achievement.dateAchieved,
        })
      })
      const achievementTypes = achievementsData.map((a) => a.type)
      console.log("🔍 All achievement types:", achievementTypes)
      const milestoneCount = achievementsData.filter((a) => a.type === "milestone").length
      const achievementCount = achievementsData.filter((a) => a.type === "achievement").length
      console.log("🔍 Milestones found:", milestoneCount)
      console.log("🔍 Achievements found:", achievementCount)
      console.log("Loaded navigation config:", navigationConfigData)
      console.log("Loaded config items:", configItemsData)
      console.log("Loaded all config items:", allConfigItemsData)
      console.log("Loaded field configurations:", fieldConfigurationsData)

      setUsers(usersData)
      setInitiatives(initiativesData)
      setAchievements(achievementsData)

      console.log("🚨 CRITICAL: About to set achievements state with:", achievementsData.length, "items")
      console.log(
        "🚨 CRITICAL: Milestones in data being set:",
        achievementsData.filter((a) => a.type === "milestone").length,
      )

      setNavigationConfig(navigationConfigData)
      setAllConfigItems(allConfigItemsData)
      setAllFieldConfigurations(fieldConfigurationsData)

      // Group config items by category
      const groupedConfigItems = groupConfigItems(configItemsData)
      console.log("Grouped config items:", groupedConfigItems)
      setConfigItems(groupedConfigItems)

      // Group field configurations by section
      const groupedFieldConfigurations = groupFieldConfigurations(fieldConfigurationsData)
      console.log("Grouped field configurations:", groupedFieldConfigurations)
      setFieldConfigurations(groupedFieldConfigurations)

      // Force immediate state verification
      setTimeout(() => {
        console.log("🚨 CRITICAL: State verification after setAchievements:")
        console.log("🚨 CRITICAL: achievements state length:", achievements.length)
        console.log("🚨 CRITICAL: milestones in state:", achievements.filter((a) => a.type === "milestone").length)
        console.log("🚨 CRITICAL: achievements in state:", achievements.filter((a) => a.type === "achievement").length)
        console.log(
          "🚨 CRITICAL: Raw achievements state:",
          achievements.map((a) => ({ id: a.id, title: a.title, type: a.type })),
        )
      }, 0)

      setTimeout(() => {
        console.log("🚨 CRITICAL: Final state check after 100ms timeout:")
        console.log("🚨 CRITICAL: achievements length:", achievements.length)
        console.log("🚨 CRITICAL: milestones in state:", achievements.filter((a) => a.type === "milestone").length)
      }, 100)

      console.log("=== SupabaseDatabaseContext.loadData END ===")
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      if (!skipLoadingState) {
        setLoading(false)
      }
      setIsOptimisticUpdate(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    console.log("🔥 ACHIEVEMENTS STATE CHANGED:")
    console.log("🔥 Total achievements:", achievements.length)
    console.log("🔥 Milestones:", achievements.filter((a) => a.type === "milestone").length)
    console.log("🔥 Achievements:", achievements.filter((a) => a.type === "achievement").length)
    console.log(
      "🔥 Achievement data:",
      achievements.map((a) => ({ id: a.id, title: a.title, type: a.type })),
    )
  }, [achievements])

  // User methods
  const updateUser = async (id: string, updates: Partial<User>) => {
    console.log("=== Context.updateUser START ===")
    console.log("Updating user:", id, "with:", updates)

    try {
      await databaseService.updateUser(id, updates)
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
      await databaseService.createUser(userData)
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
      await databaseService.deleteUser(id)
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
      await databaseService.createInitiative(initiative)
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
      await databaseService.updateInitiative(id, updates)
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
      await databaseService.deleteInitiative(id)
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
    console.log("🔥 Database service available:", !!databaseService)

    try {
      console.log("🔥 About to call databaseService.createAchievement...")
      const result = await databaseService.createAchievement(achievement)
      console.log("🔥 Database service returned result:", result)

      console.log("🔥 Achievement created successfully, refreshing data...")
      await loadData()
      console.log("🔥 Data refresh completed")
      console.log("🔥 === Context.createAchievement END ===")

      return result
    } catch (error) {
      console.error("🔥 ❌ Error in createAchievement:", error)
      console.error("🔥 ❌ Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      })
      throw error
    }
  }

  const updateAchievement = async (id: string, updates: UpdateAchievementData) => {
    console.log("=== Context.updateAchievement START ===")
    console.log("Updating achievement:", id, "with:", updates)

    try {
      await databaseService.updateAchievement(id, updates)
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
      await databaseService.deleteAchievement(id)
      console.log("Achievement deleted successfully, refreshing data...")
      await loadData()
      console.log("=== Context.deleteAchievement END ===")
    } catch (error) {
      console.error("Error in deleteAchievement:", error)
      throw error
    }
  }

  // Navigation methods
  const createNavigationConfig = async (config: CreateNavigationConfigData) => {
    console.log("=== Context.createNavigationConfig START ===")
    console.log("Creating navigation config:", config)

    try {
      setIsOptimisticUpdate(true)
      await databaseService.createNavigationConfig(config)
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

      await databaseService.updateNavigationConfig(id, updates)
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
      await databaseService.deleteNavigationConfig(id)
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
      setNavigationConfig((prev) => {
        const newItems = [...prev]
        updates.forEach((update) => {
          const itemIndex = newItems.findIndex((item) => item.id === update.id)
          if (itemIndex !== -1) {
            newItems[itemIndex] = { ...newItems[itemIndex], sortOrder: update.sortOrder }
          }
        })
        return newItems.sort((a, b) => a.sortOrder - b.sortOrder)
      })

      await databaseService.reorderNavigationConfig(updates)
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

  // Config item methods
  const createConfigItem = async (item: CreateConfigItemData) => {
    console.log("=== Context.createConfigItem START ===")
    console.log("Creating config item:", item)

    try {
      setIsOptimisticUpdate(true)
      await databaseService.createConfigItem(item)
      console.log("Config item created successfully, refreshing data...")
      await loadData(true) // Skip loading state
      console.log("=== Context.createConfigItem END ===")
    } catch (error) {
      console.error("Error in createConfigItem:", error)
      setIsOptimisticUpdate(false)
      throw error
    }
  }

  const updateConfigItem = async (id: string, updates: UpdateConfigItemData) => {
    console.log("=== Context.updateConfigItem START ===")
    console.log("Updating config item:", id, "with:", updates)

    try {
      setIsOptimisticUpdate(true)

      // Apply optimistic update immediately
      if (updates.color !== undefined) {
        setAllConfigItems((prev) => prev.map((item) => (item.id === id ? { ...item, color: updates.color! } : item)))

        setConfigItems((prev) => {
          const newConfigItems = { ...prev }
          Object.keys(newConfigItems).forEach((key) => {
            newConfigItems[key as keyof typeof newConfigItems] = newConfigItems[key as keyof typeof newConfigItems].map(
              (item) => (item.id === id ? { ...item, color: updates.color! } : item),
            )
          })
          return newConfigItems
        })
      }

      await databaseService.updateConfigItem(id, updates)
      console.log("Config item updated successfully")

      // Only refresh if it's not just a color update (to avoid flickering)
      if (updates.color === undefined) {
        await loadData(true)
      }

      console.log("=== Context.updateConfigItem END ===")
    } catch (error) {
      console.error("Error in updateConfigItem:", error)
      setIsOptimisticUpdate(false)
      // Revert optimistic update on error
      await loadData(true)
      throw error
    } finally {
      setIsOptimisticUpdate(false)
    }
  }

  const deleteConfigItem = async (id: string) => {
    console.log("=== Context.deleteConfigItem START ===")
    console.log("Deleting config item:", id)

    try {
      setIsOptimisticUpdate(true)
      await databaseService.deleteConfigItem(id)
      console.log("Config item deleted successfully, refreshing data...")
      await loadData(true) // Skip loading state
      console.log("=== Context.deleteConfigItem END ===")
    } catch (error) {
      console.error("Error in deleteConfigItem:", error)
      setIsOptimisticUpdate(false)
      throw error
    }
  }

  const reorderConfigItems = async (category: string, updates: { id: string; sortOrder: number }[]) => {
    console.log("=== Context.reorderConfigItems START ===")
    console.log("Reordering config items for category:", category, "with updates:", updates)

    try {
      setIsOptimisticUpdate(true)

      // Apply optimistic update immediately - update sort orders in local state
      setAllConfigItems((prev) => {
        const newItems = [...prev]
        updates.forEach((update) => {
          const itemIndex = newItems.findIndex((item) => item.id === update.id)
          if (itemIndex !== -1) {
            newItems[itemIndex] = { ...newItems[itemIndex], sortOrder: update.sortOrder }
          }
        })
        // Sort by category and then by sortOrder
        return newItems.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return a.sortOrder - b.sortOrder
        })
      })

      // Update grouped config items
      setConfigItems((prev) => {
        const categoryKey =
          category === "business_impacts"
            ? "businessImpacts"
            : category === "product_areas"
              ? "productAreas"
              : category === "process_stages"
                ? "processStages"
                : category === "gtm_types"
                  ? "gtmTypes"
                  : category

        const updatedCategoryItems = [...prev[categoryKey as keyof typeof prev]]
        updates.forEach((update) => {
          const itemIndex = updatedCategoryItems.findIndex((item) => item.id === update.id)
          if (itemIndex !== -1) {
            updatedCategoryItems[itemIndex] = { ...updatedCategoryItems[itemIndex], sortOrder: update.sortOrder }
          }
        })

        // Sort by sortOrder
        updatedCategoryItems.sort((a, b) => a.sortOrder - b.sortOrder)

        return {
          ...prev,
          [categoryKey]: updatedCategoryItems,
        }
      })

      // Perform database update
      await databaseService.reorderConfigItems(category, updates)
      console.log("Config items reordered successfully")

      // Don't refresh data - we already have the correct state
      console.log("=== Context.reorderConfigItems END ===")
    } catch (error) {
      console.error("Error in reorderConfigItems:", error)
      setIsOptimisticUpdate(false)
      // Revert optimistic update on error
      await loadData(true)
      throw error
    } finally {
      setIsOptimisticUpdate(false)
    }
  }

  // Field configuration methods
  const updateFieldConfiguration = async (id: string, updates: UpdateFieldConfigurationData) => {
    console.log("=== Context.updateFieldConfiguration START ===")
    console.log("Updating field configuration:", id, "with:", updates)

    try {
      setIsOptimisticUpdate(true)

      // Apply optimistic update immediately
      setAllFieldConfigurations((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))

      setFieldConfigurations((prev) => {
        const newFieldConfigurations = { ...prev }
        Object.keys(newFieldConfigurations).forEach((key) => {
          newFieldConfigurations[key as keyof typeof newFieldConfigurations] = newFieldConfigurations[
            key as keyof typeof newFieldConfigurations
          ].map((item) => (item.id === id ? { ...item, ...updates } : item))
        })
        return newFieldConfigurations
      })

      await databaseService.updateFieldConfiguration(id, updates)
      console.log("Field configuration updated successfully")
      console.log("=== Context.updateFieldConfiguration END ===")
    } catch (error) {
      console.error("Error in updateFieldConfiguration:", error)
      setIsOptimisticUpdate(false)
    } finally {
      setIsOptimisticUpdate(false)
    }
  }

  const reorderFieldConfigurations = async (updates: { id: string; order: number }[]) => {
    console.log("=== Context.reorderFieldConfigurations START ===")
    console.log("Reordering field configurations with updates:", updates)

    try {
      setIsOptimisticUpdate(true)

      // Apply optimistic update immediately - update order in local state
      setAllFieldConfigurations((prev) => {
        const newItems = [...prev]
        updates.forEach((update) => {
          const itemIndex = newItems.findIndex((item) => item.id === update.id)
          if (itemIndex !== -1) {
            newItems[itemIndex] = { ...newItems[itemIndex], order: update.order }
          }
        })
        // Sort by section and then by order
        return newItems.sort((a, b) => {
          if (a.sectionName !== b.sectionName) {
            return a.sectionName.localeCompare(b.sectionName)
          }
          return a.order - b.order
        })
      })

      // Update grouped field configurations
      setFieldConfigurations((prev) => {
        const newFieldConfigurations = { ...prev }
        Object.keys(newFieldConfigurations).forEach((sectionKey) => {
          const sectionItems = [...newFieldConfigurations[sectionKey as keyof typeof newFieldConfigurations]]
          updates.forEach((update) => {
            const itemIndex = sectionItems.findIndex((item) => item.id === update.id)
            if (itemIndex !== -1) {
              sectionItems[itemIndex] = { ...sectionItems[itemIndex], order: update.order }
            }
          })
          // Sort by order
          sectionItems.sort((a, b) => a.order - b.order)
          newFieldConfigurations[sectionKey as keyof typeof newFieldConfigurations] = sectionItems
        })
        return newFieldConfigurations
      })

      // Perform database update
      await databaseService.reorderFieldConfigurations(updates)
      console.log("Field configurations reordered successfully")
      console.log("=== Context.reorderFieldConfigurations END ===")
    } catch (error) {
      console.error("Error in reorderFieldConfigurations:", error)
      setIsOptimisticUpdate(false)
      // Revert optimistic update on error
      await loadData(true)
      throw error
    } finally {
      setIsOptimisticUpdate(false)
    }
  }

  const value: SupabaseDatabaseContextType = {
    users,
    initiatives,
    achievements,
    navigationConfig,
    configItems,
    allConfigItems,
    fieldConfigurations,
    allFieldConfigurations,
    loading,
    error,
    isOptimisticUpdate,
    updateUser,
    createUser,
    deleteUser,
    createInitiative,
    updateInitiative,
    deleteInitiative,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    createNavigationConfig,
    updateNavigationConfig,
    deleteNavigationConfig,
    reorderNavigationConfig,
    createConfigItem,
    updateConfigItem,
    deleteConfigItem,
    reorderConfigItems,
    updateFieldConfiguration,
    reorderFieldConfigurations,
    refreshData: loadData,
    loadData,
  }

  return <SupabaseDatabaseContext.Provider value={value}>{children}</SupabaseDatabaseContext.Provider>
}

export function useSupabaseDatabase() {
  const context = useContext(SupabaseDatabaseContext)
  if (context === undefined) {
    throw new Error("useSupabaseDatabase must be used within a SupabaseDatabaseProvider")
  }
  return context
}
