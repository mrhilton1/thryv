"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Trash2,
  Target,
  X,
  Plus,
  MessageSquare,
} from "lucide-react"
import { InitiativesFilters } from "./initiatives-filters"
import type { Initiative } from "@/types"

interface InitiativesListProps {
  initiatives: Initiative[]
  onView?: (initiative: Initiative) => void
  onEdit?: (initiative: Initiative) => void
  onDelete?: (initiative: Initiative) => void
}

type SortField = "title" | "description" | "status" | "priority" | "progress" | "end_date"
type SortDirection = "asc" | "desc"

interface Note {
  id: string
  content: string
  author: string
  createdAt: string
}

export function InitiativesList({ initiatives, onView, onEdit, onDelete }: InitiativesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("title")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [notes, setNotes] = useState<Record<string, Note[]>>({})
  const [newNote, setNewNote] = useState("")
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    team: [] as string[],
    tier: [] as string[],
    owner: [] as string[],
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const truncateText = (text: string, maxLength = 80) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const handleRowClick = (initiative: Initiative) => {
    setSelectedInitiative(initiative)
    setShowDetailModal(true)
  }

  const handleAddNote = () => {
    if (!selectedInitiative || !newNote.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      author: "Current User", // Replace with actual user
      createdAt: new Date().toISOString(),
    }

    setNotes((prev) => ({
      ...prev,
      [selectedInitiative.id]: [...(prev[selectedInitiative.id] || []), note],
    }))
    setNewNote("")
  }

  // Helper function to get reason text from various possible field names
  const getReasonText = (initiative: Initiative) => {
    const possibleFields = [
      "reasonNotOnTrack",
      "reason_not_on_track",
      "reasonIfNotOnTrack",
      "reason_if_not_on_track",
      "Reason if not on track",
      "reasonNotOnTrackField",
      "notOnTrackReason",
    ]

    for (const field of possibleFields) {
      const value = initiative[field]
      if (value && typeof value === "string" && value.trim()) {
        return value.trim()
      }
    }

    return ""
  }

  const filteredAndSortedInitiatives = useMemo(() => {
    const filtered = initiatives.filter((initiative) => {
      // Enhanced search filter with proper null checks
      const searchLower = (searchTerm || "").toLowerCase()
      const searchMatch =
        !searchTerm ||
        (initiative.title || "").toLowerCase().includes(searchLower) ||
        (initiative.description || "").toLowerCase().includes(searchLower) ||
        ((initiative.owner && initiative.owner.name) || "").toLowerCase().includes(searchLower) ||
        (initiative.owner_name || "").toLowerCase().includes(searchLower) ||
        (initiative.team || "").toLowerCase().includes(searchLower) ||
        (initiative.goal || "").toLowerCase().includes(searchLower) ||
        (initiative.businessImpact || "").toLowerCase().includes(searchLower) ||
        (initiative.productArea || "").toLowerCase().includes(searchLower) ||
        (initiative.executiveUpdate || "").toLowerCase().includes(searchLower) ||
        getReasonText(initiative).toLowerCase().includes(searchLower)

      // Status filter
      const statusMatch = filters.status.length === 0 || filters.status.includes(initiative.status || "")

      // Priority filter
      const priorityMatch = filters.priority.length === 0 || filters.priority.includes(initiative.priority || "")

      // Team filter
      const teamMatch = filters.team.length === 0 || filters.team.includes(initiative.team || "")

      // Tier filter
      const tierMatch = filters.tier.length === 0 || filters.tier.includes((initiative.tier || "").toString())

      // Owner filter
      const ownerName = (initiative.owner && initiative.owner.name) || initiative.owner_name || ""
      const ownerMatch = filters.owner.length === 0 || filters.owner.includes(ownerName)

      return searchMatch && statusMatch && priorityMatch && teamMatch && tierMatch && ownerMatch
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "title":
          aValue = a.title || ""
          bValue = b.title || ""
          break
        case "description":
          aValue = a.description || ""
          bValue = b.description || ""
          break
        case "status":
          aValue = a.status || ""
          bValue = b.status || ""
          break
        case "priority":
          // Custom priority sorting
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        case "progress":
          aValue = a.progress || 0
          bValue = b.progress || 0
          break
        case "end_date":
          aValue = a.end_date ? new Date(a.end_date).getTime() : 0
          bValue = b.end_date ? new Date(b.end_date).getTime() : 0
          break
        default:
          aValue = ""
          bValue = ""
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
    })

    return filtered
  }, [initiatives, searchTerm, sortField, sortDirection, filters])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "On Track":
        return "default"
      case "At Risk":
        return "secondary"
      case "Off Track":
        return "destructive"
      case "Complete":
        return "outline"
      case "Deprioritized":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "destructive"
      case "High":
        return "secondary"
      case "Medium":
        return "outline"
      case "Low":
        return "secondary"
      default:
        return "secondary"
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === "TBD") return "TBD"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "TBD"
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatNoteDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    } catch {
      return "Unknown date"
    }
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Initiatives</CardTitle>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search initiatives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <InitiativesFilters initiatives={initiatives} filters={filters} onFiltersChange={setFilters} />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedInitiatives.length} of {initiatives.length} initiatives
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("title")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Initiative
                      {getSortIcon("title")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[420px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("description")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Description
                      {getSortIcon("description")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Status
                      {getSortIcon("status")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("priority")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Priority
                      {getSortIcon("priority")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("progress")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Progress
                      {getSortIcon("progress")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("end_date")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Release Date
                      {getSortIcon("end_date")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedInitiatives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No initiatives found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedInitiatives.map((initiative) => (
                    <TableRow
                      key={initiative.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleRowClick(initiative)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{initiative.title || "Untitled"}</div>
                          <div className="text-sm text-muted-foreground">Tier {initiative.tier || "N/A"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {initiative.description ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm text-muted-foreground cursor-help">
                                {truncateText(initiative.description, 80)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p>{initiative.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">No description</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(initiative.status || "")} text-xs px-2 py-1 h-6 border`}>
                          {initiative.status || "No Status"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getPriorityColor(initiative.priority || "")} text-xs px-2 py-1 h-6 border`}
                        >
                          {initiative.priority || "No Priority"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={initiative.progress || 0} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{initiative.progress || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(initiative.end_date)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onView?.(initiative)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit?.(initiative)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete?.(initiative)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Initiative Detail Modal with improved UX */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {/* Custom close button */}
          <button
            onClick={() => setShowDetailModal(false)}
            className="absolute right-6 top-6 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          {selectedInitiative && (
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold mb-4">{selectedInitiative.title}</h1>
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(selectedInitiative.status || "")} text-xs px-2 py-1 h-6 border`}>
                    {selectedInitiative.status || "No Status"}
                  </Badge>
                  <Badge
                    className={`${getPriorityColor(selectedInitiative.priority || "")} text-xs px-2 py-1 h-6 border`}
                  >
                    {selectedInitiative.priority || "No Priority"}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-1 h-6 border">
                    Tier {selectedInitiative.tier || "N/A"}
                  </Badge>
                  <div className="ml-auto flex items-center gap-3">
                    <Progress value={selectedInitiative.progress || 0} className="w-32 h-2" />
                    <span className="text-xl font-semibold">{selectedInitiative.progress || 0}%</span>
                  </div>
                </div>
              </div>

              <Separator className="mb-8" />

              {/* Owner Section with Process Stage and GTM Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  {(selectedInitiative.owner && selectedInitiative.owner.name) || selectedInitiative.owner_name ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(
                            (selectedInitiative.owner && selectedInitiative.owner.name) ||
                              selectedInitiative.owner_name ||
                              "",
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">
                          {(selectedInitiative.owner && selectedInitiative.owner.name) ||
                            selectedInitiative.owner_name ||
                            "Unassigned"}
                        </div>
                        <div className="text-xs text-muted-foreground">Initiative Owner</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No owner assigned</div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Process Stage</h3>
                  <Badge variant="outline" className="text-xs px-2 py-1 h-6">
                    {selectedInitiative.processStage || "No stage set"}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">GTM Type</h3>
                  <Badge variant="outline" className="text-xs px-2 py-1 h-6">
                    {selectedInitiative.estimatedGTMType || "No GTM type set"}
                  </Badge>
                </div>
              </div>

              <Separator className="mb-8" />

              {/* Description and Release Date */}
              <div className="mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4" />
                      <h3 className="font-semibold">Description</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInitiative.description || "No description provided"}
                    </p>

                    {/* Timeline moved here */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium mb-1 text-muted-foreground">Start Date</div>
                          <div className="text-sm">{formatDate(selectedInitiative.start_date) || "TBD"}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1 text-muted-foreground">Release Date</div>
                          <div className="text-sm">{formatDate(selectedInitiative.end_date) || "TBD"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal */}
              {selectedInitiative.goal && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">Goal</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedInitiative.goal}</p>
                </div>
              )}

              {/* Business Impact */}
              {selectedInitiative.businessImpact && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">Business Impact</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedInitiative.businessImpact}</p>
                </div>
              )}

              {/* Product Area */}
              {selectedInitiative.productArea && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">Product Area</h3>
                  <p className="text-muted-foreground">{selectedInitiative.productArea}</p>
                </div>
              )}

              {/* Reason if not on track - conditional */}
              {getReasonText(selectedInitiative) && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">Reason if not on track</h3>
                  <p className="text-muted-foreground leading-relaxed">{getReasonText(selectedInitiative)}</p>
                </div>
              )}

              {/* Executive Update - conditional */}
              {selectedInitiative.executiveUpdate && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-4">Executive Update</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedInitiative.executiveUpdate}</p>
                </div>
              )}

              {/* Notes & Updates Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="font-semibold">Notes & Updates</h3>
                </div>

                {/* Add Note Form */}
                <div className="mb-6 p-6 bg-muted/30 rounded-lg">
                  <Textarea
                    placeholder="Add a note or update..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="mb-4 min-h-[120px] resize-none"
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {notes[selectedInitiative.id]?.length > 0 ? (
                    notes[selectedInitiative.id].map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg bg-background">
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{note.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs font-medium">
                                {getInitials(note.author)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground font-medium">{note.author}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatNoteDate(note.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No notes yet. Add the first note to track updates and progress.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
