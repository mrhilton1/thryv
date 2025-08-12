"use client"

import { useState, useMemo } from "react"
import { SupabaseDatabaseProvider, useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { AdminProvider } from "@/contexts/admin-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExecutiveDashboard } from "@/components/executive-dashboard"
import { InitiativeForm } from "@/components/initiative-form"
import { InitiativeDetailModal } from "@/components/initiative-detail-modal"
import { CalendarView } from "@/components/calendar-view"
import { ExecutiveSummaryComponent } from "@/components/executive-summary"
import { AdminPanel } from "@/components/admin-panel"
import { InitiativesMasterList } from "@/components/initiatives-master-list"
import type { InitiativeWithRelations } from "@/lib/database/schemas"
import { exportToCSV } from "@/utils/export"
import { AuthProvider } from "@/contexts/auth-context" // Import AuthProvider

// Create a wrapper component that uses the database context
function AppContent() {
  const {
    initiatives,
    achievements,
    users,
    navigationConfig,
    refreshData,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    createInitiative,
    updateInitiative,
    deleteInitiative,
  } = useSupabaseDatabase()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showInitiativeForm, setShowInitiativeForm] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState<InitiativeWithRelations | undefined>()
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeWithRelations | null>(null)

  const filteredAchievements = useMemo(() => achievements.filter((a) => a.type === "achievement"), [achievements])
  const filteredMilestones = useMemo(() => achievements.filter((a) => a.type === "milestone"), [achievements])

  const handleEditInitiative = (initiative: InitiativeWithRelations) => {
    setEditingInitiative(initiative)
    setShowInitiativeForm(true)
  }

  const handleRowClick = (initiative: InitiativeWithRelations) => {
    setSelectedInitiative(initiative)
    setShowDetailModal(true)
  }

  const handleCreateInitiative = () => {
    setEditingInitiative(undefined)
    setShowInitiativeForm(true)
  }

  const handleDeleteInitiative = (id: string) => {
    try {
      console.log("Deleting initiative with ID:", id)
      deleteInitiative(id)
      refreshData()
    } catch (error) {
      console.error("Error deleting initiative:", error)
      alert("Error deleting initiative. Please check the console for details.")
    }
  }

  const handleSaveInitiative = (initiativeData: any) => {
    try {
      console.log("AppContent: Saving initiative with data:", initiativeData)

      // Get current user (for demo, using first admin user)
      const currentUser = users.find((user) => user.role === "admin")
      if (!currentUser) {
        console.error("No admin user found")
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
        estimatedGTMType: initiativeData.estimatedGTMType?.trim() || undefined,
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
        console.log("Updating existing initiative:", editingInitiative.id)
        updateInitiative(editingInitiative.id, cleanedData, currentUser.id)
      } else {
        // Create new initiative
        console.log("Creating new initiative")
        createInitiative(cleanedData)
      }

      console.log("Initiative saved successfully")
      refreshData()
      setShowInitiativeForm(false)
      setEditingInitiative(undefined)
    } catch (error) {
      console.error("Error saving initiative:", error)
      // Don't throw the error, just log it so the form doesn't crash
      alert("Error saving initiative. Please check the console for details.")
    }
  }

  const handleExport = () => {
    exportToCSV(initiatives)
  }

  const handleExportPDF = () => {
    const executiveSummary = initiatives.find((initiative) => initiative.type === "executiveSummary")
    const summaryWithRelations = executiveSummary ? executiveSummary : undefined
    // exportToPDF(initiatives, summaryWithRelations)
  }

  const handleSaveSummary = (summaryData: any) => {
    const currentUser = users.find((user) => user.role === "admin") || users[0]
    const currentUserId = currentUser?.id || "1" // fallback to "1" for summary
    const existingSummary = initiatives.find((initiative) => initiative.type === "executiveSummary")

    if (existingSummary) {
      updateInitiative(existingSummary.id, summaryData, currentUserId)
    } else {
      createInitiative({
        ...summaryData,
        createdById: currentUserId,
        updatedById: currentUserId,
        type: "executiveSummary",
      })
    }

    refreshData()
  }

  const handleSaveAchievement = async (achievementData: any) => {
    const currentUser = users.find((user) => user.role === "admin") || users[0]
    const currentUserId = currentUser?.id || null

    console.log("=== handleSaveAchievement START ===")
    console.log("achievementData received:", achievementData)
    console.log("Current user:", currentUser)
    console.log("Current user ID:", currentUserId)
    console.log("Current achievements count before save:", achievements.length)
    console.log("Environment check - Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing")
    console.log(
      "Environment check - Supabase Key:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
    )

    try {
      if (achievementData.id && achievementData.id.includes("-")) {
        // This is an existing item being updated
        console.log("Updating existing achievement with ID:", achievementData.id)
        const result = await updateAchievement(achievementData.id, achievementData)
        console.log("Update result:", result)
      } else {
        // This is a new item being created
        console.log("Creating new achievement")
        const newAchievementData = {
          title: achievementData.title,
          description: achievementData.description,
          icon: achievementData.icon || "CheckCircle",
          type: achievementData.type,
          date_achieved: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
          created_by_id: currentUserId,
          ...(achievementData.initiativeId && { initiative_id: achievementData.initiativeId }),
        }
        console.log("New achievement data to create:", newAchievementData)

        const newAchievement = await createAchievement(newAchievementData)
        console.log("✅ Created achievement result:", newAchievement)

        console.log("Achievements array after create (before refresh):", achievements.length)
      }

      console.log("Calling refreshData...")
      await refreshData()

      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log("Current achievements count after refresh:", achievements.length)
        console.log("All achievements after refresh:", achievements)
        console.log("=== handleSaveAchievement END ===")
      }, 500) // Increased delay to 500ms
    } catch (error) {
      console.error("❌ Error in handleSaveAchievement:", error)
      alert(`Error saving achievement: ${error.message || error}`)
    }
  }

  const handleDeleteAchievement = (id: string) => {
    console.log("Deleting achievement with ID:", id)
    const result = deleteAchievement(id)
    console.log("Delete result:", result)
    refreshData()
  }

  const handleUpdateUser = (userId: string, updates: any) => {
    // db.updateUser(userId, updates)
    refreshData()
  }

  const renderContent = () => {
    // Check if this is a custom navigation item that doesn't have a corresponding component
    const navItem = navigationConfig.find((item) => item.id === activeTab)
    const isCustomItem = navItem && !navItem.isDefault

    if (isCustomItem) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{navItem.name}</h1>
            <p className="text-muted-foreground">{navItem.description || "This is a custom navigation item."}</p>
          </div>
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Custom Page Placeholder</h3>
              <p className="text-gray-500">
                This is a placeholder for the "{navItem.name}" page. In a real application, you would implement the
                specific functionality for this section.
              </p>
            </div>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case "dashboard":
        return <ExecutiveDashboard initiatives={initiatives} onDeleteInitiative={handleDeleteInitiative} />
      case "initiatives":
        return (
          <>
            <InitiativesMasterList
              onEdit={handleEditInitiative}
              onCreate={handleCreateInitiative}
              onExport={handleExport}
              onSaveInitiative={handleSaveInitiative}
            />
            <InitiativeForm
              open={showInitiativeForm}
              onOpenChange={setShowInitiativeForm}
              initiative={editingInitiative}
              users={users}
              onSave={handleSaveInitiative}
            />
          </>
        )
      case "summary":
        const executiveSummary = initiatives.find((initiative) => initiative.type === "executiveSummary")
        const summaryWithRelations = executiveSummary ? executiveSummary : undefined

        console.log("=== RENDERING SUMMARY TAB ===")
        console.log("All achievements in app:", achievements)
        console.log(
          "Raw achievements data:",
          achievements.map((a) => ({ id: a.id, title: a.title, type: a.type })),
        )

        if (!achievements || achievements.length === 0) {
          console.log("⏳ Achievements not loaded yet, showing loading state")
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading achievements and milestones...</p>
              </div>
            </div>
          )
        }

        console.log(
          "Filtered achievements:",
          filteredAchievements.map((a) => ({ id: a.id, title: a.title, type: a.type })),
        )
        console.log(
          "Filtered milestones:",
          filteredMilestones.map((a) => ({ id: a.id, title: a.title, type: a.type })),
        )
        console.log("Achievements count:", filteredAchievements.length)
        console.log("Milestones count:", filteredMilestones.length)

        console.log("🚀 ABOUT TO PASS PROPS TO ExecutiveSummaryComponent:")
        console.log("🚀 achievements prop:", filteredAchievements.length, "items")
        console.log("🚀 milestones prop:", filteredMilestones.length, "items")
        console.log(
          "🚀 milestones data:",
          filteredMilestones.map((m) => ({ id: m.id, title: m.title, type: m.type })),
        )
        console.log("=== END SUMMARY TAB DEBUG ===")

        return (
          <ExecutiveSummaryComponent
            key={`summary-${achievements.length}-${Date.now()}`}
            initiatives={initiatives}
            summary={summaryWithRelations}
            achievements={filteredAchievements}
            milestones={filteredMilestones}
            onSave={handleSaveSummary}
            onSaveAchievement={handleSaveAchievement}
            onDeleteAchievement={handleDeleteAchievement}
            onExport={handleExportPDF}
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
        return <ExecutiveDashboard initiatives={initiatives} onDeleteInitiative={handleDeleteInitiative} />
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} onUpdateUser={handleUpdateUser}>
      {renderContent()}
      {selectedInitiative && (
        <InitiativeDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          initiative={selectedInitiative}
          onEdit={handleEditInitiative}
        />
      )}
    </DashboardLayout>
  )
}

export default function App() {
  return (
    <SupabaseDatabaseProvider>
      <AuthProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </AuthProvider>
    </SupabaseDatabaseProvider>
  )
}
