"use client"
import { InitiativesParent } from "@/components/initiatives-parent"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { useAuth } from "@/contexts/auth-context"

export default function InitiativesPage() {
  const { initiatives, users, configItems, createInitiative, updateInitiative, deleteInitiative, refreshData } =
    useSupabaseDatabase()
  const { user } = useAuth()

  const handleSaveInitiative = async (initiativeData: any) => {
    try {
      console.log("Saving initiative with data:", initiativeData)

      // Get current user
      const currentUser = users.find((u) => u.role === "admin") || users[0]
      if (!currentUser) {
        throw new Error("No user found")
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

      // Check if we're editing an existing initiative
      const existingInitiative = initiatives.find((i) => i.title === initiativeData.title && i.id !== undefined)

      if (existingInitiative) {
        // Update existing initiative
        await updateInitiative(existingInitiative.id, cleanedData)
      } else {
        // Create new initiative
        await createInitiative(cleanedData)
      }

      // Refresh data to get latest changes
      await refreshData()
    } catch (error) {
      console.error("Error saving initiative:", error)
      throw error // Re-throw so the form doesn't close
    }
  }

  const handleDeleteInitiative = async (initiative: any) => {
    try {
      await deleteInitiative(initiative.id)
      await refreshData()
    } catch (error) {
      console.error("Error deleting initiative:", error)
      alert("Error deleting initiative. Please try again.")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <InitiativesParent
        initiatives={initiatives}
        users={users}
        configItems={configItems}
        onSaveInitiative={handleSaveInitiative}
        onDeleteInitiative={handleDeleteInitiative}
      />
    </div>
  )
}
