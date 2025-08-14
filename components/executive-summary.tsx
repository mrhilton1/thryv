"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseDatabase } from "@/contexts/api-database-context"
import type { Initiative, ExecutiveSummary, Achievement } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Edit,
  Save,
  X,
  Plus,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Download,
  FileText,
  Flag,
  Eye,
} from "lucide-react"
import { AchievementsMilestones } from "./achievements-milestones"

interface ExecutiveSummaryProps {
  initiatives: Initiative[]
  summary?: ExecutiveSummary
  onSave: (summary: Partial<ExecutiveSummary>) => void
  onDeleteAchievement?: (id: string) => void
  onExport: () => void
}

export function ExecutiveSummaryComponent({
  initiatives,
  summary,
  onSave,
  onDeleteAchievement,
  onExport,
}: ExecutiveSummaryProps) {
  const { user, hasPermission } = useAuth()
  const {
    createAchievement,
    updateAchievement,
    refreshData,
    achievements: contextAchievements,
    deleteAchievement,
  } = useSupabaseDatabase()

  const achievements = contextAchievements.filter((a) => a.type === "achievement")
  const milestones = contextAchievements.filter((a) => a.type === "milestone")

  console.log("ExecutiveSummary - context achievements total:", contextAchievements.length)
  console.log("ExecutiveSummary - filtered achievements:", achievements.length)
  console.log("ExecutiveSummary - filtered milestones:", milestones.length)

  console.log("ExecutiveSummary - initiatives received:", initiatives)
  console.log("ExecutiveSummary - summary received:", summary)

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: summary?.title || "",
    content: summary?.content || "",
    highlights: summary?.highlights || ([] as string[]),
    risks: summary?.risks || ([] as string[]),
  })
  const [newHighlight, setNewHighlight] = useState("")
  const [newRisk, setNewRisk] = useState("")
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  useEffect(() => {
    if (summary) {
      setEditData({
        title: summary.title || "",
        content: summary.content || "",
        highlights: summary.highlights || [],
        risks: summary.risks || [],
      })
    }
  }, [summary])

  useEffect(() => {
    console.log("🔥 ExecutiveSummary - Props updated:")
    console.log("🔥 ExecutiveSummary - initiatives received:", initiatives)
    console.log("🔥 ExecutiveSummary - summary received:", summary)
  }, [initiatives, summary])

  const handleSave = () => {
    onSave(editData)
    setIsEditing(false)
  }

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setEditData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()],
      }))
      setNewHighlight("")
    }
  }

  const removeHighlight = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }))
  }

  const addRisk = () => {
    if (newRisk.trim()) {
      setEditData((prev) => ({
        ...prev,
        risks: [...prev.risks, newRisk.trim()],
      }))
      setNewRisk("")
    }
  }

  const removeRisk = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      risks: prev.risks.filter((_, i) => i !== index),
    }))
  }

  const isInitiativeAtRisk = (initiative: Initiative) => {
    return initiative.status === "At Risk" || initiative.status === "Off Track"
  }

  const getNotableCardStyling = (initiative: Initiative) => {
    if (isInitiativeAtRisk(initiative)) {
      return "bg-yellow-50 border-yellow-200"
    }
    return "bg-green-50 border-green-200"
  }

  const getNotableFlagColor = (initiative: Initiative) => {
    if (isInitiativeAtRisk(initiative)) {
      return "text-yellow-600 fill-yellow-600"
    }
    return "text-green-600 fill-green-600"
  }

  const getRiskCardStyling = (initiative: Initiative) => {
    return "bg-red-50 border-red-200"
  }

  const getRiskFlagColor = (initiative: Initiative) => {
    return "text-red-500 fill-red-500"
  }

  const handleShowSummary = (initiative: Initiative) => {
    setSelectedInitiative(initiative)
    setShowSummaryModal(true)
  }

  const insights = {
    totalInitiatives: initiatives.length,
    completedInitiatives: initiatives.filter((i) => i.status === "Complete").length,
    inProgressInitiatives: initiatives.filter((i) => i.status === "On Track").length,
    atRiskInitiatives: initiatives.filter((i) => i.status === "At Risk" || i.status === "Off Track").length,
    avgProgress: initiatives.length > 0 ? initiatives.reduce((sum, i) => sum + i.progress, 0) / initiatives.length : 0,
    criticalInitiatives: initiatives.filter((i) => i.priority === "Critical"),
    completionRate:
      initiatives.length > 0
        ? (initiatives.filter((i) => i.status === "Complete").length / initiatives.length) * 100
        : 0,
  }

  const generateAutoSummary = () => {
    const { totalInitiatives, completedInitiatives, avgProgress, atRiskInitiatives } = insights

    let statusText = "All initiatives are on track"
    if (atRiskInitiatives > 0) {
      statusText = `${atRiskInitiatives} initiative${atRiskInitiatives > 1 ? "s" : ""} require${atRiskInitiatives === 1 ? "s" : ""} attention`
    }

    return `This executive summary provides an overview of our ${totalInitiatives} strategic initiative${totalInitiatives !== 1 ? "s" : ""}. We have completed ${completedInitiatives} initiative${completedInitiatives !== 1 ? "s" : ""} with an average progress of ${avgProgress.toFixed(1)}%. ${statusText}.`
  }

  const handleSaveAchievement = async (achievement: Partial<Achievement>) => {
    try {
      console.log("🚀 ExecutiveSummary - Direct save function called with:", achievement)

      if (achievement.id) {
        // Update existing achievement/milestone
        console.log("🚀 ExecutiveSummary - Updating existing item with id:", achievement.id)
        const updateData = {
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          initiative_id: achievement.initiative_id,
          type: achievement.type,
        }
        console.log("🚀 ExecutiveSummary - Calling updateAchievement with:", updateData)
        await updateAchievement(achievement.id, updateData)
        console.log("🚀 ExecutiveSummary - Update completed")
      } else {
        // Create new achievement/milestone
        console.log("🚀 ExecutiveSummary - Creating new item")
        const achievementData = {
          ...achievement,
          date_achieved: new Date().toISOString().split("T")[0], // Today's date
          created_by_id: user?.id || achievements[0]?.created_by_id || "00000000-0000-0000-0000-000000000001",
        }
        console.log("🚀 ExecutiveSummary - Calling createAchievement with:", achievementData)
        const result = await createAchievement(achievementData)
        console.log("🚀 ExecutiveSummary - createAchievement result:", result)
      }

      // Refresh data to update UI
      await refreshData()
      console.log("🚀 ExecutiveSummary - Data refreshed")
    } catch (error) {
      console.error("❌ ExecutiveSummary - Error saving achievement:", error)
      throw error
    }
  }

  const handleDeleteAchievement = async (id: string) => {
    try {
      console.log("🗑️ ExecutiveSummary - Direct delete function called with id:", id)

      const result = await deleteAchievement(id)
      console.log("🗑️ ExecutiveSummary - deleteAchievement result:", result)

      // Refresh data to update UI
      await refreshData()
      console.log("🗑️ ExecutiveSummary - Data refreshed after delete")

      return result
    } catch (error) {
      console.error("❌ ExecutiveSummary - Error deleting achievement:", error)
      throw error
    }
  }

  const getReasonText = (initiative: Initiative): string => {
    console.log("🔍 Getting reason text for initiative:", initiative.id)
    console.log("🔍 Initiative object keys:", Object.keys(initiative))
    console.log("🔍 Full initiative object:", initiative)

    // Try multiple possible field names for the reason
    const possibleFields = [
      "reasonIfNotOnTrack",
      "reasonNotOnTrack",
      "reason_if_not_on_track",
      "reason_not_on_track",
      "reasonIfNotOntrack",
      "reasonNotOntrack",
      "Reason if not on track", // Exact field name from form
      "reasonwhywearenotOntrack",
      "reasonwhywearenotOnTrack",
    ]

    for (const field of possibleFields) {
      const value = (initiative as any)[field]
      console.log(`🔍 Checking field "${field}":`, value)
      if (value && typeof value === "string" && value.trim() !== "") {
        console.log(`✅ Found reason text in field "${field}":`, value)
        return value.trim()
      }
    }

    console.log("❌ No reason text found in any field")
    return "No reason provided yet."
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Executive Summary -{" "}
            {new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
          </h1>
          <p className="text-muted-foreground">Curated high-level overview for leadership</p>
        </div>
        <div className="flex items-center space-x-2">
          {hasPermission("export") && (
            <Button variant="outline" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
          {hasPermission("write") && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Summary
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="content">Summary Content</Label>
                <Textarea
                  id="content"
                  value={editData.content}
                  onChange={(e) => setEditData((prev) => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground leading-relaxed">
              <span className="text-xl font-semibold text-foreground">Tldr;</span>{" "}
              {editData.content || generateAutoSummary()}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Initiatives</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalInitiatives}</div>
            <p className="text-xs text-muted-foreground">{insights.inProgressInitiatives} in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.completionRate.toFixed(1)}%</div>
            <Progress value={insights.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.avgProgress.toFixed(1)}%</div>
            <Progress value={insights.avgProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{insights.atRiskInitiatives}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <AchievementsMilestones
        achievements={achievements}
        milestones={milestones}
        onSave={handleSaveAchievement}
        onDelete={handleDeleteAchievement}
        initiatives={initiatives}
      />

      {initiatives.filter((i) => i.showOnExecutiveSummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notable Updates</CardTitle>
            <CardDescription>Initiatives marked for executive attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initiatives
                .filter((i) => i.showOnExecutiveSummary)
                .map((initiative) => (
                  <Card key={initiative.id} className={`${getNotableCardStyling(initiative)} border`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Flag className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getNotableFlagColor(initiative)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{initiative.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {initiative.status}
                              </Badge>
                            </div>
                            <p className="text-sm opacity-80 mt-1 mb-2">{initiative.description}</p>
                            <div className="text-sm">
                              <span className="font-medium">Update:</span>
                              <p className="mt-1 text-muted-foreground">
                                {initiative.executiveUpdate || "No update provided yet."}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <div className="text-right">
                            <div className="text-lg font-semibold">{initiative.progress}%</div>
                            <Progress value={initiative.progress} className="w-20 mt-1" />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleShowSummary(initiative)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Risks and Blockers</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {editData.risks.map((risk, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{risk}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeRisk(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new risk or blocker"
                  value={newRisk}
                  onChange={(e) => setNewRisk(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRisk())}
                />
                <Button onClick={addRisk}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {initiatives.filter((i) => isInitiativeAtRisk(i)).length > 0 ? (
                <div className="space-y-4">
                  {initiatives
                    .filter((i) => isInitiativeAtRisk(i))
                    .map((initiative) => (
                      <Card key={initiative.id} className={`${getRiskCardStyling(initiative)} border`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Flag className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getRiskFlagColor(initiative)}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{initiative.title}</h4>
                                  <Badge variant="outline">{initiative.status}</Badge>
                                </div>
                                <p className="text-sm opacity-80 mt-1 mb-2">{initiative.description}</p>
                                <div className="text-sm">
                                  <span className="font-medium">Update:</span>
                                  <p className="mt-1 text-muted-foreground">{getReasonText(initiative)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{initiative.progress}%</div>
                              <Progress value={initiative.progress} className="w-20 mt-1" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No risks or blockers identified.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedInitiative?.title}</DialogTitle>
          </DialogHeader>
          {selectedInitiative && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedInitiative.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge variant="outline">{selectedInitiative.status}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Progress</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedInitiative.progress} className="flex-1" />
                    <span className="text-sm">{selectedInitiative.progress}%</span>
                  </div>
                </div>
              </div>
              {selectedInitiative.executiveUpdate && (
                <div>
                  <h4 className="font-medium mb-2">Executive Update</h4>
                  <p className="text-sm text-muted-foreground">{selectedInitiative.executiveUpdate}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ExecutiveSummaryComponent as ExecutiveSummary }
