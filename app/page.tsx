"use client"

import { useState, useEffect } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { SupabaseDatabaseProvider, useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { AdminProvider } from "@/contexts/admin-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExecutiveDashboard } from "@/components/executive-dashboard"
import { InitiativeForm } from "@/components/initiative-form"
import { InitiativeDetailModal } from "@/components/initiative-detail-modal"
import { CalendarView } from "@/components/calendar-view"
import { ExecutiveSummary } from "@/components/executive-summary"
import { AdminPanel } from "@/components/admin-panel"
import { InitiativesMasterList } from "@/components/initiatives-master-list"
import type { InitiativeWithRelations } from "@/lib/database/schemas"
import { exportToPDF, exportToCSV } from "@/utils/export"

// Create a wrapper component that uses the database context
function AppContent() {
  const {
    initiatives = [],
    achievements = [],
    users = [],
    configItems,
    navigationConfig,
    refreshData,
    createInitiative,
    updateInitiative,
    deleteInitiative,
    createAchievement,
    deleteAchievement,
  } = useSupabaseDatabase()

  const [activeTab, setActiveTab] = useState("")
  const [showInitiativeForm, setShowInitiativeForm] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState<InitiativeWithRelations | undefined>()
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeWithRelations | null>(null)
  const [initialFormData, setInitialFormData] = useState<any>(undefined) // Added state for initial form data

  useEffect(() => {
    if (!activeTab && navigationConfig && navigationConfig.length > 0) {
      // Get the first visible navigation item, sorted by order
      const firstNavItem = navigationConfig
        .filter((item) => item.isVisible || item.is_visible)
        .sort((a, b) => (a.sortOrder || a.sort_order || 0) - (b.sortOrder || b.sort_order || 0))[0]

      if (firstNavItem) {
        const itemName = firstNavItem.itemLabel || firstNavItem.item_label || firstNavItem.name || firstNavItem.label
        const tabId = getTabIdFromNavItem(itemName)
        setActiveTab(tabId)
      } else {
        setActiveTab("dashboard") // fallback
      }
    }
  }, [activeTab, navigationConfig])

  const getTabIdFromNavItem = (itemName: string) => {
    const nameToTabMap: Record<string, string> = {
      "Executive Summary": "summary",
      Initiatives: "initiatives",
      Calendar: "calendar",
      Dashboard: "dashboard",
      Admin: "admin",
    }
    return nameToTabMap[itemName] || itemName.toLowerCase().replace(/\s+/g, "-")
  }

  const handleTabChange = (tab: string) => {
    console.log("Tab changing to:", tab)
    setActiveTab(tab)
  }

  const handleEditInitiative = (initiative: InitiativeWithRelations) => {
    console.log("🔧 Edit initiative clicked:", initiative.title)
    console.log("🔧 Initiative data:", initiative)

    // Clear any existing state first
    setSelectedInitiative(null)
    setShowDetailModal(false)

    // Set the initiative to edit and open the form
    setEditingInitiative(initiative)
    setShowInitiativeForm(true)

    console.log("🔧 Form should now be open with initiative:", initiative.id)
  }

  const handleRowClick = (initiative: InitiativeWithRelations) => {
    setSelectedInitiative(initiative)
    setShowDetailModal(true)
  }

  const handleCreateInitiative = (initialData?: any) => {
    // Added optional initialData parameter
    console.log("Create initiative clicked", initialData ? "with initial data" : "")
    setEditingInitiative(undefined)
    setShowInitiativeForm(true)
    // Store initial data for the form
    if (initialData) {
      setInitialFormData(initialData) // Store initial data in state
    } else {
      setInitialFormData(undefined)
    }
  }

  const handleSaveInitiative = async (initiativeData: any) => {
    try {
      console.log("AppContent: Saving initiative with data:", initiativeData)

      // Get current user (for demo, using first admin user)
      const currentUser = users.find((user) => user.role === "admin") || users[0]
      if (!currentUser) {
        console.error("No user found")
        alert("No user found. Please ensure you are logged in.")
        return
      }

      const cleanedData = {
        title: initiativeData.title?.trim() || "",
        description: initiativeData.description?.trim() || "",
        goal: initiativeData.goal?.trim() || undefined,
        productArea: initiativeData.productArea?.trim() || "",
        team: initiativeData.team?.trim() || "",
        tier: Number(initiativeData.tier) || 1,
        ownerId: initiativeData.ownerId || currentUser.id,
        status: initiativeData.status || "On Track",
        processStage: initiativeData.processStage || "Planned",
        priority: initiativeData.priority || "Medium",
        businessImpact: initiativeData.businessImpact || "Increase Revenue",
        startDate: initiativeData.startDate?.trim() || undefined,
        estimatedReleaseDate: initiativeData.estimatedReleaseDate?.trim() || undefined,
        actualReleaseDate: initiativeData.actualReleaseDate?.trim() || undefined,
        estimatedGtmType: initiativeData.estimatedGTMType?.trim() || undefined,
        progress: Number(initiativeData.progress) || 0,
        tags: Array.isArray(initiativeData.tags) ? initiativeData.tags : [],
        executiveUpdate: initiativeData.executiveUpdate?.trim() || undefined,
        reasonIfNotOnTrack: initiativeData.reasonIfNotOnTrack?.trim() || undefined,
        createdById: currentUser.id,
        lastUpdatedById: currentUser.id,
        showOnExecutiveSummary: Boolean(initiativeData.showOnExecutiveSummary),
      }

      console.log("Cleaned data for database:", cleanedData)

      if (editingInitiative) {
        // Update existing initiative
        await updateInitiative(editingInitiative.id, cleanedData)
      } else {
        // Create new initiative
        await createInitiative(cleanedData)
      }

      setShowInitiativeForm(false)
      setEditingInitiative(undefined)
    } catch (error) {
      console.error("Error saving initiative:", error)
      alert("Error saving initiative. Please check the console for details.")
    }
  }

  // Handle initiative update (for stakeholder updates and other quick updates)
  const handleUpdateInitiative = async (id: string, updates: any) => {
    console.log("=== handleUpdateInitiative START ===")
    console.log("Updating initiative ID:", id, "with updates:", updates)

    try {
      // Get current user (for demo, using first admin user)
      const currentUser = users.find((user) => user.role === "admin") || users[0]

      const updateData = {
        ...updates,
        lastUpdatedById: currentUser?.id || "unknown",
      }

      await updateInitiative(id, updateData)
      console.log("Initiative updated successfully")
      console.log("=== handleUpdateInitiative END ===")
    } catch (error) {
      console.error("Error in handleUpdateInitiative:", error)
      throw error
    }
  }

  const handleExport = () => {
    exportToCSV(initiatives)
  }

  const handleExportPDF = () => {
    // For now, export current initiatives
    exportToPDF(initiatives, undefined)
  }

  const handleSaveSummary = async (summaryData: any) => {
    try {
      // This will be handled by the executive summary component
      await refreshData()
    } catch (error) {
      console.error("Error saving summary:", error)
    }
  }

  const handleSaveAchievement = async (achievementData: any) => {
    console.log("=== handleSaveAchievement START ===")
    console.log("achievementData received:", achievementData)
    console.log("Current achievements count before save:", achievements.length)

    try {
      // Get current user (for demo, using first admin user)
      const currentUser = users.find((user) => user.role === "admin") || users[0]
      if (!currentUser) {
        console.error("No user found")
        return
      }

      const cleanedAchievementData = {
        title: achievementData.title?.trim() || "",
        description: achievementData.description?.trim() || "",
        type: achievementData.type || "achievement",
        dateAchieved: achievementData.dateAchieved || new Date().toISOString(),
        createdById: currentUser.id,
        initiativeId: achievementData.initiativeId || undefined,
      }

      console.log("Calling createAchievement with:", cleanedAchievementData)
      await createAchievement(cleanedAchievementData)

      setTimeout(() => {
        console.log("Current achievements count after refresh:", achievements.length)
        console.log("=== handleSaveAchievement END ===")
      }, 100)
    } catch (error) {
      console.error("Error in handleSaveAchievement:", error)
      alert("Error saving achievement. Please check the console for details.")
    }
  }

  const handleDeleteAchievement = async (id: string) => {
    console.log("Deleting achievement with ID:", id)
    try {
      await deleteAchievement(id)
    } catch (error) {
      console.error("Error deleting achievement:", error)
      alert("Error deleting achievement. Please check the console for details.")
    }
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await refreshData()
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ExecutiveDashboard
            initiatives={initiatives}
            onDeleteInitiative={handleDeleteAchievement}
            onUpdateInitiative={handleUpdateInitiative}
          />
        )
      case "initiatives":
        console.log("🔧 Rendering initiatives tab")
        console.log("🔧 handleEditInitiative function:", !!handleEditInitiative)
        return (
          <InitiativesMasterList
            onEdit={handleEditInitiative}
            onCreate={handleCreateInitiative}
            onExport={handleExport}
            onUpdateInitiative={handleUpdateInitiative}
          />
        )
      case "summary":
        // Debug logging
        console.log("=== RENDERING SUMMARY TAB ===")
        console.log("All achievements in app:", achievements)
        const filteredAchievements = achievements.filter((a) => a.type === "achievement")
        const filteredMilestones = achievements.filter((a) => a.type === "milestone")
        console.log("Filtered achievements:", filteredAchievements)
        console.log("Filtered milestones:", filteredMilestones)
        console.log("=== END SUMMARY TAB DEBUG ===")

        return (
          <ExecutiveSummary
            initiatives={initiatives}
            achievements={filteredAchievements}
            onInitiativeClick={handleRowClick}
          />
        )
      case "calendar":
        return <CalendarView initiatives={initiatives} />
      case "admin":
        return <AdminPanel onUpdateUser={handleUpdateUser} />
      case "settings":
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
            <p className="text-muted-foreground">Personal preferences and account settings.</p>
          </div>
        )
      default:
        return <ExecutiveDashboard initiatives={initiatives} onDeleteInitiative={handleDeleteAchievement} />
    }
  }

  return (
    <AdminProvider>
      <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange} onUpdateUser={handleUpdateUser}>
        {renderContent()}

        {/* Initiative Form Modal */}
        <InitiativeForm
          open={showInitiativeForm}
          onOpenChange={setShowInitiativeForm}
          initiative={editingInitiative}
          users={users}
          config={configItems}
          onSave={handleSaveInitiative}
          initialData={undefined} // Clear this when editing
        />

        {/* Initiative Detail Modal */}
        {selectedInitiative && (
          <InitiativeDetailModal
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
            initiative={selectedInitiative}
            onEdit={handleEditInitiative}
          />
        )}
      </DashboardLayout>
    </AdminProvider>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <SupabaseDatabaseProvider>
        <AppContent />
      </SupabaseDatabaseProvider>
    </AuthProvider>
  )
}
