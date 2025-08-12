"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Eye, Edit, Flag, Trash2 } from "lucide-react"
import { StakeholderUpdateModal } from "./stakeholder-update-modal"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { useAdmin } from "@/contexts/admin-context"
import type { InitiativeWithRelations } from "@/lib/database/schemas"

interface InitiativesListProps {
  initiatives: InitiativeWithRelations[]
  onViewDetails: (initiative: InitiativeWithRelations) => void
  onEditInitiative: (initiative: InitiativeWithRelations) => void
  onUpdateInitiative: (id: string, updates: any) => Promise<void>
}

export function InitiativesList({
  initiatives = [],
  onViewDetails,
  onEditInitiative,
  onUpdateInitiative,
}: InitiativesListProps) {
  const { users, deleteInitiative } = useSupabaseDatabase()
  const { config } = useAdmin()
  const [showStakeholderModal, setShowStakeholderModal] = useState(false)
  const [selectedInitiativeForStakeholder, setSelectedInitiativeForStakeholder] =
    useState<InitiativeWithRelations | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedInitiativeForDelete, setSelectedInitiativeForDelete] = useState<InitiativeWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getStatusColor = (status: string) => {
    const statusConfig = config.statuses?.find((s) => s.label === status)
    if (statusConfig?.color) return statusConfig.color

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

  const getPriorityColor = (priority: string) => {
    const priorityConfig = config.priorities?.find((p) => p.label === priority)
    if (priorityConfig?.color) return priorityConfig.color

    switch (priority) {
      case "High":
        return "border-red-200 text-red-700"
      case "Medium":
        return "border-yellow-200 text-yellow-700"
      case "Low":
        return "border-green-200 text-green-700"
      default:
        return "border-gray-200 text-gray-700"
    }
  }

  const getOwnerInfo = (initiative: InitiativeWithRelations) => {
    const owner = users.find((user) => user.id === initiative.ownerId)

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

  const handleDeleteClick = (initiative: InitiativeWithRelations, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedInitiativeForDelete(initiative)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedInitiativeForDelete) return

    try {
      setIsDeleting(true)
      await deleteInitiative(selectedInitiativeForDelete.id)
      setShowDeleteDialog(false)
      setSelectedInitiativeForDelete(null)
    } catch (error) {
      console.error("Error deleting initiative:", error)
      // You could add a toast notification here for error feedback
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStakeholderSave = async (
    initiativeId: string,
    updates: { executiveUpdate: string; showOnExecutiveSummary: boolean },
  ) => {
    await onUpdateInitiative(initiativeId, updates)
  }

  const handleStakeholderRemove = async (initiativeId: string) => {
    await onUpdateInitiative(initiativeId, {
      executiveUpdate: "",
      showOnExecutiveSummary: false,
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Initiative</TableHead>
              <TableHead className="font-semibold text-gray-700">Owner</TableHead>
              <TableHead className="font-semibold text-gray-700">Team</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Priority</TableHead>
              <TableHead className="font-semibold text-gray-700">Progress</TableHead>
              <TableHead className="font-semibold text-gray-700">Release Date</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initiatives.map((initiative) => {
              const ownerInfo = getOwnerInfo(initiative)

              return (
                <TableRow
                  key={initiative.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewDetails(initiative)}
                >
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{initiative.title}</div>
                      <div className="text-sm text-gray-500">
                        {initiative.productArea} • Tier {initiative.tier}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ownerInfo.avatar || "/placeholder.svg"} alt={ownerInfo.name} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {ownerInfo.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900">{ownerInfo.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <span className="text-sm text-gray-900">{initiative.team}</span>
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge variant="outline" className={`${getStatusColor(initiative.status)} border`}>
                      {initiative.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge variant="outline" className={`${getPriorityColor(initiative.priority)} border`}>
                      {initiative.priority}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <Progress value={initiative.progress} className="w-16 h-2" />
                      <span className="text-sm text-gray-600 min-w-[3rem]">{initiative.progress}%</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <span className="text-sm text-gray-900">
                      {initiative.estimatedReleaseDate
                        ? new Date(initiative.estimatedReleaseDate).toLocaleDateString()
                        : "TBD"}
                    </span>
                  </TableCell>

                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewDetails(initiative)
                        }}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleStakeholderFlagClick(initiative, e)}
                        className={`h-8 w-8 ${
                          initiative.showOnExecutiveSummary
                            ? "text-green-600 hover:text-green-700"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={initiative.showOnExecutiveSummary ? "Edit Stakeholder Update" : "Add Stakeholder Update"}
                      >
                        <Flag className={`h-4 w-4 ${initiative.showOnExecutiveSummary ? "fill-current" : ""}`} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditInitiative(initiative)
                        }}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                        title="Edit Initiative"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteClick(initiative, e)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete Initiative"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Initiative</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedInitiativeForDelete?.title}"? This action cannot be undone and
              will permanently remove the initiative and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Initiative"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
