"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { Achievement, Initiative } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  Target,
  Trophy,
  Zap,
  Smartphone,
  Clock,
  Plus,
  Edit,
  Trash2,
  Award,
  Rocket,
  Star,
  TrendingUp,
} from "lucide-react"

interface AchievementsMilestonesProps {
  achievements: Achievement[]
  milestones: Achievement[]
  onSave: (item: Partial<Achievement>) => void
  onDelete: (id: string) => void
  initiatives?: Initiative[]
}

const iconOptions = [
  { value: "CheckCircle", label: "Check Circle", icon: CheckCircle },
  { value: "Target", label: "Target", icon: Target },
  { value: "Trophy", label: "Trophy", icon: Trophy },
  { value: "Award", label: "Award", icon: Award },
  { value: "Zap", label: "Lightning", icon: Zap },
  { value: "Rocket", label: "Rocket", icon: Rocket },
  { value: "Star", label: "Star", icon: Star },
  { value: "TrendingUp", label: "Trending Up", icon: TrendingUp },
  { value: "Smartphone", label: "Mobile", icon: Smartphone },
  { value: "Clock", label: "Clock", icon: Clock },
]

export function AchievementsMilestones({
  achievements,
  milestones,
  onSave,
  onDelete,
  initiatives = [],
}: AchievementsMilestonesProps) {
  const { user, hasPermission } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Achievement | null>(null)
  const [modalType, setModalType] = useState<"achievement" | "milestone">("achievement")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "CheckCircle",
    initiativeId: "",
  })

  // Debug logging
  console.log("AchievementsMilestones - achievements received:", achievements)
  console.log("AchievementsMilestones - milestones received:", milestones)

  console.log("🔍 INITIATIVE DEBUG - initiatives received:", initiatives.length)
  console.log(
    "🔍 INITIATIVE DEBUG - initiatives data:",
    initiatives.map((i) => ({ id: i.id, title: i.title })),
  )
  console.log(
    "🔍 INITIATIVE DEBUG - achievements with initiativeId:",
    achievements.map((a) => ({
      id: a.id,
      title: a.title,
      initiativeId: a.initiativeId,
    })),
  )
  console.log(
    "🔍 INITIATIVE DEBUG - milestones with initiativeId:",
    milestones.map((m) => ({
      id: m.id,
      title: m.title,
      initiativeId: m.initiativeId,
    })),
  )

  const handleAdd = (type: "achievement" | "milestone") => {
    console.log("handleAdd called with type:", type)
    setModalType(type)
    setEditingItem(null)
    setFormData({ title: "", description: "", icon: "CheckCircle", initiativeId: "" })
    setShowModal(true)
  }

  const handleEdit = (item: Achievement) => {
    console.log("🔍 EDIT DEBUG - item being edited:", item)
    console.log("🔍 EDIT DEBUG - item.initiativeId:", item.initiativeId)
    console.log(
      "🔍 EDIT DEBUG - available initiatives:",
      initiatives.map((i) => ({ id: i.id, title: i.title })),
    )

    setModalType(item.type)
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      icon: item.icon,
      initiativeId: item.initiativeId || "none",
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formData.title.trim()) return

    console.log("🔥 MILESTONE DEBUG - handleSave called with formData:", formData)
    console.log("🔥 MILESTONE DEBUG - modalType:", modalType)
    console.log("🔥 MILESTONE DEBUG - editingItem:", editingItem)

    let processedInitiativeId = null
    if (formData.initiativeId && formData.initiativeId !== "none" && formData.initiativeId !== "") {
      processedInitiativeId = formData.initiativeId
    }

    const itemData: Partial<Achievement> = {
      title: formData.title,
      description: formData.description,
      icon: formData.icon,
      type: modalType,
      initiativeId: processedInitiativeId,
      ...(editingItem
        ? {
            id: editingItem.id,
          }
        : {
            created_at: new Date().toISOString(),
            date_achieved: new Date().toISOString().split("T")[0],
          }),
    }

    console.log("🔥 MILESTONE DEBUG - Final itemData being sent:", itemData)
    console.log("🔥 MILESTONE DEBUG - processedInitiativeId:", processedInitiativeId)

    onSave(itemData)
    setShowModal(false)

    setFormData({ title: "", description: "", icon: "CheckCircle", initiativeId: "" })
    setEditingItem(null)
  }

  const getIcon = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName)
    return iconOption ? iconOption.icon : CheckCircle
  }

  const renderCard = (item: Achievement, bgColor: string) => {
    const IconComponent = getIcon(item.icon)

    console.log(`🔍 ASSOCIATION DEBUG - ${item.title}:`)
    console.log(`  - item.initiativeId: "${item.initiativeId}" (type: ${typeof item.initiativeId})`)
    console.log(`  - initiatives array length: ${initiatives.length}`)
    console.log(
      `  - initiatives IDs:`,
      initiatives.map((i) => `"${i.id}" (${typeof i.id})`),
    )

    console.log(`🔍 DETAILED COMPARISON for ${item.title}:`)
    console.log(`  - Looking for initiativeId: "${item.initiativeId}"`)
    console.log(`  - Available initiative IDs:`)
    initiatives.forEach((init, index) => {
      console.log(`    [${index}] ID: "${init.id}" | Title: "${init.title}"`)
      console.log(`    [${index}] Exact match: ${init.id === item.initiativeId}`)
      console.log(`    [${index}] String match: ${String(init.id) === String(item.initiativeId)}`)
      console.log(`    [${index}] ID length: ${init.id?.length} vs ${item.initiativeId?.length}`)
    })

    const associatedInitiative = initiatives.find((init) => {
      const match = String(init.id) === String(item.initiativeId)
      console.log(`  - Compare "${init.id}" === "${item.initiativeId}": ${match}`)
      return match
    })

    console.log(
      `  - associatedInitiative found:`,
      associatedInitiative ? { id: associatedInitiative.id, title: associatedInitiative.title } : "NONE",
    )

    if (!associatedInitiative && item.initiativeId) {
      console.log(`❌ INITIATIVE NOT FOUND: "${item.initiativeId}" not in available initiatives`)
      console.log(`❌ This suggests the initiative was deleted or the ID is incorrect`)
    }

    return (
      <Card key={item.id} className={`${bgColor} border-0`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{item.title}</h4>
                <p className="text-sm opacity-80 mt-1">{item.description}</p>
                {associatedInitiative ? (
                  <p className="text-xs opacity-60 mt-1 italic">{associatedInitiative.title}</p>
                ) : item.initiativeId ? (
                  <p className="text-xs opacity-60 mt-1 text-red-500">Initiative ID: {item.initiativeId} (NOT FOUND)</p>
                ) : null}
              </div>
            </div>
            {hasPermission("write") && (
              <div className="flex items-center space-x-1 ml-2">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    if (onDelete && typeof onDelete === "function") {
                      onDelete(item.id)
                    } else {
                      console.warn("onDelete function is not available")
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Achievements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Trophy className="mr-2 h-5 w-5" />
              Recent Achievements ({achievements.length})
            </h3>
            {hasPermission("write") && (
              <Button variant="outline" size="sm" onClick={() => handleAdd("achievement")}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No achievements added yet.</p>
            ) : (
              achievements.map((item) => renderCard(item, "bg-green-50 text-green-900"))
            )}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Upcoming Milestones ({milestones.length})
            </h3>
            {hasPermission("write") && (
              <Button variant="outline" size="sm" onClick={() => handleAdd("milestone")}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones added yet.</p>
            ) : (
              milestones.map((item) => renderCard(item, "bg-blue-50 text-blue-900"))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Add"} {modalType === "achievement" ? "Achievement" : "Milestone"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the details below." : `Add a new ${modalType} to track progress.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="initiative">Initiative (Optional)</Label>
              <Select
                value={formData.initiativeId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, initiativeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an initiative (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Initiative</SelectItem>
                  {initiatives.map((initiative) => (
                    <SelectItem key={initiative.id} value={initiative.id}>
                      {initiative.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.title.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
