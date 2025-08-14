"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Target, TrendingUp, Clock, FileText, MessageSquare, Building, X, Plus } from "lucide-react"
import type { InitiativeWithRelations } from "@/lib/database/schemas"
import { format } from "date-fns"

interface InitiativeDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initiative: InitiativeWithRelations | null
  onEdit: (initiative: InitiativeWithRelations) => void
}

export function InitiativeDetailModal({ open, onOpenChange, initiative, onEdit }: InitiativeDetailModalProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState("")
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [localNotes, setLocalNotes] = useState<any[]>([])

  // Initialize local notes when initiative changes
  useEffect(() => {
    if (initiative?.notes) {
      setLocalNotes([...initiative.notes])
    } else {
      setLocalNotes([])
    }
  }, [initiative])

  // Return null if no initiative is provided
  if (!initiative) {
    return null
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    setIsSubmittingNote(true)
    try {
      // Create a new note object
      const newNote = {
        id: Date.now().toString(),
        content: newNoteContent.trim(),
        createdAt: new Date().toISOString(),
        createdBy: {
          id: "current-user",
          name: "Current User",
          avatar: "/placeholder.svg",
        },
      }

      // Add the note to local state
      setLocalNotes((prev) => [newNote, ...prev])
      setNewNoteContent("")
      setShowAddNote(false)
    } catch (error) {
      console.error("Error adding note:", error)
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800 border-green-200"
      case "At Risk":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Off Track":
        return "bg-red-100 text-red-800 border-red-200"
      case "Complete":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "On Hold":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Safe date formatting function
  const formatDate = (dateString?: string, fallback = "Not set") => {
    if (!dateString) return fallback
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (error) {
      return fallback
    }
  }

  const formatNoteDate = (dateString?: string, fallback = "Unknown date") => {
    if (!dateString) return fallback
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a")
    } catch (error) {
      return fallback
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          button[aria-label="Close"]:not(#custom-close-btn),
          [data-dialog-content] button[type="button"]:not(#custom-close-btn):not(#add-note-btn):not(#submit-note-btn):not(#cancel-note-btn) {
            display: none !important;
          }
        `,
        }}
      />
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 rounded-lg overflow-hidden">
        {/* Custom Close Button */}
        <button
          id="custom-close-btn"
          type="button"
          className="custom-close-button absolute right-6 top-6 z-50 h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 flex items-center justify-center"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* Header Section */}
        <div className="flex-shrink-0 bg-white border-b px-8 py-6 pr-16 rounded-t-lg">
          <DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <DialogTitle className="text-2xl flex-shrink-0">
                  {initiative.title || "Untitled Initiative"}
                </DialogTitle>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Progress value={initiative.progress || 0} className="w-32 h-2" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                    {initiative.progress || 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-1 h-6 border">
                  Tier {initiative.tier || 1}
                </Badge>
                <Badge className={`${getStatusColor(initiative.status || "")} text-xs px-2 py-1 h-6 border`}>
                  {initiative.status || "No status"}
                </Badge>
                <Badge className={`${getPriorityColor(initiative.priority || "")} text-xs px-2 py-1 h-6 border`}>
                  {initiative.priority || "No priority"}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-8 py-6 space-y-8">
            {/* Owner Section with Process Stage and GTM Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                {initiative.owner && (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={initiative.owner.avatar || "/placeholder.svg"} alt={initiative.owner.name} />
                      <AvatarFallback className="text-sm">{initiative.owner.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{initiative.owner.name}</div>
                      <div className="text-xs text-muted-foreground">Initiative Owner</div>
                    </div>
                  </div>
                )}
                {!initiative.owner && <div className="text-sm text-muted-foreground">No owner assigned</div>}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Process Stage</h3>
                <Badge variant="outline" className="text-xs px-2 py-1 h-6">
                  {initiative.processStage || "No stage set"}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">GTM Type</h3>
                <Badge variant="outline" className="text-xs px-2 py-1 h-6">
                  {initiative.estimatedGTMType || "No GTM type set"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Basic Information - Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {initiative.description || "No description provided"}
                  </p>

                  {/* Timeline moved here */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium mb-1 text-muted-foreground">Start Date</div>
                        <div className="text-sm">{formatDate(initiative.startDate)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium mb-1 text-muted-foreground">Release Date</div>
                        <div className="text-sm">{formatDate(initiative.estimatedReleaseDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Goal
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {initiative.goal || "No goal specified"}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Product Area
                  </h3>
                  <p className="text-sm text-muted-foreground">{initiative.productArea || "No product area"}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Business Impact
                  </h3>
                  <Badge variant="outline" className="text-xs px-2 py-1 h-6">
                    {initiative.businessImpact || "No impact specified"}
                  </Badge>
                </div>

                {/* Conditionally show Reason if not on track */}
                {initiative.reasonNotOnTrack && (
                  <div>
                    <h3 className="font-semibold mb-3">Reason if not on track</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{initiative.reasonNotOnTrack}</p>
                  </div>
                )}

                {/* Conditionally show Executive update */}
                {initiative.executiveUpdate && (
                  <div>
                    <h3 className="font-semibold mb-3">Executive Update</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{initiative.executiveUpdate}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Notes & Updates Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notes & Updates
                </h3>
                <button
                  id="add-note-btn"
                  onClick={() => setShowAddNote(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors text-sm font-medium"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>

              {/* Add Note Form */}
              {showAddNote && (
                <div className="mb-6 p-6 border rounded-lg bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="note-content" className="text-sm font-medium">
                        Add a new note or update
                      </Label>
                      <Textarea
                        id="note-content"
                        placeholder="Enter your note or update here..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="mt-2 min-h-[120px]"
                        rows={5}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        id="submit-note-btn"
                        onClick={handleAddNote}
                        disabled={!newNoteContent.trim() || isSubmittingNote}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                      >
                        {isSubmittingNote ? "Adding..." : "Add Note"}
                      </button>
                      <button
                        id="cancel-note-btn"
                        onClick={() => {
                          setShowAddNote(false)
                          setNewNoteContent("")
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Display - Note text on top, user on bottom */}
              <div className="space-y-4">
                {localNotes && localNotes.length > 0 ? (
                  localNotes.map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3">{note.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={note.createdBy?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {note.createdBy?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground font-medium">
                            {note.createdBy?.name || "Unknown"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatNoteDate(note.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg bg-gray-50">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No notes added yet.</p>
                    <p className="text-xs mt-1">Click "Add Note" to get started.</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-2 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>
                  Created by {initiative.createdBy?.name || "Unknown"} on{" "}
                  {formatDate(initiative.createdAt, "Unknown date")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>
                  Last updated by {initiative.lastUpdatedBy?.name || "Unknown"} on{" "}
                  {formatDate(initiative.lastUpdated, "Unknown date")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
