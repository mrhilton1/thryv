"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Database } from '@/lib/database/database'
import { createSeedDatabase } from '@/lib/database/seed-data'
import { InitiativeWithRelations, AchievementWithRelations, ExecutiveSummaryWithRelations, User, ConfigItem, NavigationConfig } from '@/lib/database/schemas'

interface DatabaseContextType {
  db: Database
  // Reactive data that updates when database changes
  initiatives: InitiativeWithRelations[]
  achievements: AchievementWithRelations[]
  users: User[]
  configItems: {
    teams: ConfigItem[]
    businessImpacts: ConfigItem[]
    productAreas: ConfigItem[]
    processStages: ConfigItem[]
    priorities: ConfigItem[]
    statuses: ConfigItem[]
    gtmTypes: ConfigItem[]
  }
  navigationConfig: NavigationConfig[]
  // Trigger re-renders when data changes
  refreshData: () => void
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db] = useState(() => createSeedDatabase())
  const [initiatives, setInitiatives] = useState<InitiativeWithRelations[]>([])
  const [achievements, setAchievements] = useState<AchievementWithRelations[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [configItems, setConfigItems] = useState({
    teams: [] as ConfigItem[],
    businessImpacts: [] as ConfigItem[],
    productAreas: [] as ConfigItem[],
    processStages: [] as ConfigItem[],
    priorities: [] as ConfigItem[],
    statuses: [] as ConfigItem[],
    gtmTypes: [] as ConfigItem[]
  })
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig[]>([])

  const refreshData = () => {
    console.log('Refreshing data...') // Debug log
    setInitiatives(db.getAllInitiativesWithRelations())
    const allAchievements = db.getAchievementsWithRelations()
    console.log('All achievements from DB:', allAchievements) // Debug log
    setAchievements(allAchievements)
    setUsers(db.users().where('isActive', '=', true).get())
    setNavigationConfig(db.getNavigationConfig())
    setConfigItems({
      teams: db.getConfigItems('teams'),
      businessImpacts: db.getConfigItems('businessImpacts'),
      productAreas: db.getConfigItems('productAreas'),
      processStages: db.getConfigItems('processStages'),
      priorities: db.getConfigItems('priorities'),
      statuses: db.getConfigItems('statuses'),
      gtmTypes: db.getConfigItems('gtmTypes')
    })
  }

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [db])

  return (
    <DatabaseContext.Provider value={{
      db,
      initiatives,
      achievements,
      users,
      configItems,
      navigationConfig,
      refreshData
    }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}
