"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Clock, Target, Trash2, Flag } from "lucide-react"
import { StakeholderUpdateModal } from "./stakeholder-update-modal"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import type { InitiativeWithRelations } from "@/lib/database/schemas"

interface ExecutiveDashboardProps {
  initiatives?: InitiativeWithRelations[]
  onDeleteInitiative?: (id: string) => void
  onUpdateInitiative?: (id: string, updates: any) => Promise<void>
}

export function ExecutiveDashboard({
  initiatives = [],
  onDeleteInitiative,
  onUpdateInitiative,
}: ExecutiveDashboardProps) {
  const { users } = useSupabaseDatabase()
  const [selectedTier, setSelectedTier] = useState<number | "all">("all")
  const [showStakeholderModal, setShowStakeholderModal] = useState(false)
  const [selectedInitiativeForStakeholder, setSelectedInitiativeForStakeholder] =
    useState<InitiativeWithRelations | null>(null)

  // Calculate metrics with safe array access
  const totalInitiatives = initiatives?.length || 0
  const onTrackInitiatives = initiatives?.filter((i) => i.status === "On Track")?.length || 0
  const atRiskInitiatives = initiatives?.filter((i) => i.status === "At Risk")?.length || 0
  const blockedInitiatives = initiatives?.filter((i) => i.status === "Blocked")?.length || 0
  const completedInitiatives = initiatives?.filter((i) => i.status === "Completed")?.length || 0

  // Filter initiatives by tier with safe array access
  const filteredInitiatives =
    selectedTier === "all" ? initiatives || [] : (initiatives || []).filter((i) => i.tier === selectedTier)

  // Group initiatives by status
  const initiativesByStatus = {
    "On Track": filteredInitiatives.filter((i) => i.status === "On Track"),
    "At Risk": filteredInitiatives.filter((i) => i.status === "At Risk"),
    Blocked: filteredInitiatives.filter((i) => i.status === "Blocked"),
    Completed: filteredInitiatives.filter((i) => i.status === "Completed"),
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "On Track":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "At Risk":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "Blocked":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800 border-green-200"
      case "At Risk":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Blocked":
        return "bg-red-100 text-red-800 border-red-200"
      case "Completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getOwnerInfo = (initiative: InitiativeWithRelations) => {
    const owner = users?.find((user) => user.id === initiative.ownerId)

    if (owner) {
      return {
        name: owner.name,
        avatar: owner.avatar || `/placeholder.svg?height=32&width=32&text=${owner.name.charAt(0)}`,
      }
    }

    if (initiative.owner) {
      return {
        name: initiative.owner.name || "Unknown Owner",
        avatar:
          initiative.owner.avatar ||
          `/placeholder.svg?height=32&width=32&text=${initiative.owner.name?.charAt(0) || "U"}`,
      }
    }

    return {
      name: "Unknown Owner",
      avatar: `/placeholder.svg?height=32&width=32&text=U`,
    }
  }

  const handleStakeholderFlagClick = (initiative: InitiativeWithRelations, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedInitiativeForStakeholder(initiative)
    setShowStakeholderModal(true)
  }

  const handleStakeholderSave = async (
    initiativeId: string,
    updates: { executiveUpdate: string; showOnExecutiveSummary: boolean },
  ) => {
    if (onUpdateInitiative) {
      await onUpdateInitiative(initiativeId, updates)
    }
  }

  const handleStakeholderRemove = async (initiativeId: string) => {
    if (onUpdateInitiative) {
      await onUpdateInitiative(initiativeId, {
        executiveUpdate: "",
        showOnExecutiveSummary: false,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground">Overview of all strategic initiatives and their current status</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Initiatives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInitiatives}</div>
            <p className="text-xs text-muted-foreground">Across all tiers and teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onTrackInitiatives}</div>
            <p className="text-xs text-muted-foreground">
              {totalInitiatives > 0 ? Math.round((onTrackInitiatives / totalInitiatives) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{atRiskInitiatives}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedInitiatives}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedTier === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTier("all")}
        >
          All Tiers
        </Button>
        {[1, 2, 3].map((tier) => (
          <Button
            key={tier}
            variant={selectedTier === tier ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTier(tier)}
          >
            Tier {tier}
          </Button>
        ))}
      </div>

      {/* Initiatives by Status */}
      <Tabs defaultValue="On Track" className="space-y-4">
        <TabsList>
          <TabsTrigger value="On Track">On Track ({initiativesByStatus["On Track"].length})</TabsTrigger>
          <TabsTrigger value="At Risk">At Risk ({initiativesByStatus["At Risk"].length})</TabsTrigger>
          <TabsTrigger value="Blocked">Blocked ({initiativesByStatus["Blocked"].length})</TabsTrigger>
          <TabsTrigger value="Completed">Completed ({initiativesByStatus["Completed"].length})</TabsTrigger>
        </TabsList>

        {Object.entries(initiativesByStatus).map(([status, statusInitiatives]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {statusInitiatives.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No initiatives with status: {status}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statusInitiatives.map((initiative) => {
                  const ownerInfo = getOwnerInfo(initiative)

                  return (
                    <Card key={initiative.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleStakeholderFlagClick(initiative, e)}
                                className={`h-6 w-6 ${
                                  initiative.showOnExecutiveSummary
                                    ? "text-green-600 hover:text-green-700"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                                title={
                                  initiative.showOnExecutiveSummary
                                    ? "Edit Stakeholder Update"
                                    : "Add Stakeholder Update"
                                }
                              >
                                <Flag
                                  className={`h-3 w-3 ${initiative.showOnExecutiveSummary ? "fill-current" : ""}`}
                                />
                              </Button>
                              <CardTitle className="text-base leading-tight">{initiative.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Tier {initiative.tier}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getStatusColor(initiative.status)}`}>
                                {getStatusIcon(initiative.status)}
                                <span className="ml-1">{initiative.status}</span>
                              </Badge>
                            </div>
                          </div>
                          {onDeleteInitiative && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteInitiative(initiative.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{initiative.description}</p>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{initiative.progress}%</span>
                          </div>
                          <Progress value={initiative.progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ownerInfo.avatar || "/placeholder.svg"} alt={ownerInfo.name} />
                              <AvatarFallback className="text-xs">{ownerInfo.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{ownerInfo.name}</span>
                          </div>

                          <div className="text-xs text-muted-foreground">{initiative.team}</div>
                        </div>

                        {initiative.executiveUpdate && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              <strong>Stakeholder Update:</strong> {initiative.executiveUpdate}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Stakeholder Update Modal */}
      {selectedInitiativeForStakeholder && (
        <StakeholderUpdateModal
          open={showStakeholderModal}
          onOpenChange={setShowStakeholderModal}
          initiative={selectedInitiativeForStakeholder}
          onSave={handleStakeholderSave}
          onRemove={handleStakeholderRemove}
        />
      )}
    </div>
  )
}
