"use client"

import { useState, useMemo, useEffect } from "react"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { useAdmin } from "@/contexts/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Download, FileSpreadsheet, AlertCircle, CheckCircle, Plus } from "lucide-react"
import { InitiativesList } from "./initiatives-list"
import type { InitiativeWithRelations } from "@/lib/database/schemas"
import { InitiativeDetailModal } from "./initiative-detail-modal"

interface InitiativesMasterListProps {
  onEdit: (initiative: InitiativeWithRelations) => void
  onCreate: () => void
  onExport: () => void
  onUpdateInitiative: (id: string, updates: any) => Promise<void>
}

export function InitiativesMasterList({ onEdit, onCreate, onExport, onUpdateInitiative }: InitiativesMasterListProps) {
  const { initiatives = [], users = [] } = useSupabaseDatabase()
  const { config } = useAdmin()
  const [searchTerm, setSearchTerm] = useState("")
  const [showSpreadsheetImport, setShowSpreadsheetImport] = useState(false)
  const [importData, setImportData] = useState("")
  const [importError, setImportError] = useState("")
  const [parsedData, setParsedData] = useState<any>(null)
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeWithRelations | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Global function to populate initiative form (for import functionality)
  useEffect(() => {
    window.populateInitiativeForm = (data: any) => {
      // Close import modal
      setShowSpreadsheetImport(false)
      setImportData("")
      setParsedData(null)
      setImportError("")

      // Trigger create with populated data
      onCreate()

      // Populate form after a short delay
      setTimeout(() => {
        if (window.populateInitiativeForm) {
          window.populateInitiativeForm(data)
        }
      }, 100)
    }

    return () => {
      delete window.populateInitiativeForm
    }
  }, [onCreate])

  const parseSpreadsheetData = () => {
    try {
      setImportError("")

      if (!importData.trim()) {
        setImportError("Please paste some data to import")
        return
      }

      // Clean up the input data - remove extra line breaks within the data
      const cleanedData = importData.trim().replace(/\n+/g, " ").replace(/\r+/g, " ")

      // More robust parsing - handle tabs first (most common from spreadsheets)
      let values: string[] = []

      if (cleanedData.includes("\t")) {
        // Tab-separated - split on tabs and handle quoted fields properly
        const tabSplit = cleanedData.split("\t")
        values = []
        let currentValue = ""
        let inQuotes = false

        for (let i = 0; i < tabSplit.length; i++) {
          const part = tabSplit[i]

          if (!inQuotes && part.startsWith('"') && !part.endsWith('"')) {
            // Start of quoted field
            inQuotes = true
            currentValue = part.substring(1) // Remove opening quote
          } else if (inQuotes && part.endsWith('"')) {
            // End of quoted field
            currentValue += "\t" + part.substring(0, part.length - 1) // Remove closing quote
            values.push(currentValue.trim())
            currentValue = ""
            inQuotes = false
          } else if (inQuotes) {
            // Middle of quoted field
            currentValue += "\t" + part
          } else {
            // Regular field
            let cleaned = part.trim()
            if (
              (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
              (cleaned.startsWith("'") && cleaned.endsWith("'"))
            ) {
              cleaned = cleaned.slice(1, -1)
            }
            values.push(cleaned.trim())
          }
        }

        // Handle case where we're still in quotes at the end
        if (inQuotes && currentValue) {
          values.push(currentValue.trim())
        }
      } else if (cleanedData.includes("|")) {
        // Pipe-separated
        values = cleanedData.split("|").map((val) => val.trim())
      } else {
        // Try comma-separated as fallback
        values = cleanedData.split(",").map((val) => {
          let cleaned = val.trim()
          if (
            (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
            (cleaned.startsWith("'") && cleaned.endsWith("'"))
          ) {
            cleaned = cleaned.slice(1, -1)
          }
          return cleaned.trim()
        })
      }

      console.log("Parsed values:", values) // Debug log
      console.log("Number of columns found:", values.length) // Debug log

      if (values.length < 6) {
        setImportError(`Not enough columns. Found ${values.length} columns, expected at least 6. 
    
Detected columns:
${values.map((val, idx) => `${idx + 1}: "${val}"`).join("\n")}

Please ensure your data has at least: Title, Description, Goal, Product Area, Owner Email, Team

Tip: Make sure there are no line breaks within individual cells in your spreadsheet.`)
        return
      }

      const ownerEmail = values[4]?.toLowerCase()
      const owner = users.find((u) => u.email.toLowerCase() === ownerEmail)

      if (ownerEmail && !owner) {
        setImportError(
          `Owner with email "${ownerEmail}" not found. Available users: ${users.map((u) => u.email).join(", ")}`,
        )
        return
      }

      const formatDateForInput = (dateStr: string) => {
        try {
          if (!dateStr || dateStr.trim() === "") return ""

          let date: Date

          if (dateStr.includes("/")) {
            const parts = dateStr.split("/")
            if (parts.length === 3) {
              date = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[0]) - 1, Number.parseInt(parts[1]))
            } else {
              date = new Date(dateStr)
            }
          } else if (dateStr.includes("-")) {
            date = new Date(dateStr)
          } else {
            date = new Date(dateStr)
          }

          if (isNaN(date.getTime())) {
            return ""
          }

          return date.toISOString().split("T")[0]
        } catch {
          return ""
        }
      }

      const parsed = {
        title: values[0] || "",
        description: values[1] || "",
        goal: values[2] || "",
        productArea: values[3] || "",
        ownerId: owner?.id || "",
        team: values[5] || "",
        tier: Number.parseInt(values[6]) || 1,
        status: values[7] || "On Track",
        processStage: values[8] || "Planned",
        priority: values[9] || "Medium",
        businessImpact: values[10] || "Increase Revenue",
        startDate: values[11] ? formatDateForInput(values[11]) : "",
        estimatedReleaseDate: values[12] ? formatDateForInput(values[12]) : "",
        actualReleaseDate: values[13] ? formatDateForInput(values[13]) : "",
        estimatedGTMType: values[14] || "Soft Launch",
        progress: Number.parseInt(values[15]) || 0,
        tags: values[16]
          ? values[16]
              .split(";")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        executiveUpdate: values[17] || "",
        reasonIfNotOnTrack: values[18] || "",
        attachments: [],
      }

      setParsedData(parsed)
    } catch (error) {
      setImportError(`Error parsing data: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleImportAndCreate = () => {
    if (parsedData) {
      setShowSpreadsheetImport(false)
      setImportData("")
      setParsedData(null)
      setImportError("")

      onCreate()

      setTimeout(() => {
        if (window.populateInitiativeForm) {
          window.populateInitiativeForm(parsedData)
        }
      }, 100)
    }
  }

  // Enhanced search function that searches across all fields
  const searchInitiatives = (initiatives: InitiativeWithRelations[], searchTerm: string) => {
    if (!searchTerm.trim()) return initiatives

    const term = searchTerm.toLowerCase()

    return initiatives.filter((initiative) => {
      // Helper function to safely convert any value to searchable string
      const toSearchableString = (value: any): string => {
        if (value === null || value === undefined) return ""
        if (typeof value === "string") return value.toLowerCase()
        if (typeof value === "number") return value.toString()
        if (typeof value === "boolean") return value.toString()
        if (Array.isArray(value)) return value.join(" ").toLowerCase()
        if (typeof value === "object") return JSON.stringify(value).toLowerCase()
        return String(value).toLowerCase()
      }

      // Helper function to search dates in multiple formats
      const searchInDate = (dateString: string | undefined): boolean => {
        if (!dateString) return false
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return false

        // Search in various date formats
        const formats = [
          dateString.toLowerCase(),
          date.getFullYear().toString(),
          date.toLocaleDateString().toLowerCase(),
          date.toLocaleDateString("en-US", { month: "long" }).toLowerCase(),
          date.toLocaleDateString("en-US", { month: "short" }).toLowerCase(),
          date.toISOString().split("T")[0],
        ]

        return formats.some((format) => format.includes(term))
      }

      // Search in all text fields
      const textFields = [
        initiative.title,
        initiative.description,
        initiative.goal,
        initiative.productArea,
        initiative.team,
        initiative.status,
        initiative.priority,
        initiative.businessImpact,
        initiative.processStage,
        initiative.executiveUpdate,
        initiative.reasonIfNotOnTrack,
        initiative.estimatedGtmType,
      ]

      const textMatch = textFields.some((field) => toSearchableString(field).includes(term))

      // Search in numeric fields
      const numericMatch = [initiative.tier?.toString(), initiative.progress?.toString()].some((field) =>
        field?.includes(term),
      )

      // Search in tags array
      const tagsMatch = initiative.tags?.some((tag) => toSearchableString(tag).includes(term)) || false

      // Search in owner information
      const ownerMatch = [initiative.owner?.name, initiative.owner?.email].some((field) =>
        toSearchableString(field).includes(term),
      )

      // Search in dates
      const dateMatch = [
        initiative.startDate,
        initiative.estimatedReleaseDate,
        initiative.actualReleaseDate,
        initiative.createdAt,
        initiative.updatedAt,
        initiative.lastUpdated,
      ].some((dateField) => searchInDate(dateField))

      return textMatch || numericMatch || tagsMatch || ownerMatch || dateMatch
    })
  }

  const filteredInitiatives = useMemo(() => {
    return searchInitiatives(initiatives, searchTerm)
  }, [initiatives, searchTerm])

  const handleViewDetails = (initiative: InitiativeWithRelations) => {
    setSelectedInitiative(initiative)
    setShowDetailModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Master List</h2>
          <p className="text-muted-foreground">Complete list of all initiatives with detailed information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Dialog open={showSpreadsheetImport} onOpenChange={setShowSpreadsheetImport}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
              {/* Fixed Header */}
              <DialogHeader className="px-6 py-4 border-b shrink-0">
                <DialogTitle>Import Initiative from Spreadsheet</DialogTitle>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <ScrollArea className="flex-1 px-6">
                <div className="py-4 space-y-6">
                  {/* Instructions Section */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Expected Column Order:</h3>
                    <div className="bg-gray-50 p-3 rounded-md border">
                      <div className="text-xs font-mono text-wrap break-words leading-relaxed">
                        Title | Description | Goal | Product Area | Owner Email | Team | Tier | Status | Process Stage |
                        Priority | Business Impact | Start Date | Estimated Release Date | Actual Release Date | GTM
                        Type | Progress | Tags | Executive Update | Reason if not on track
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <div className="text-xs text-blue-800 space-y-1">
                        <p>
                          <strong>Quick Tips:</strong>
                        </p>
                        <p>• Copy and paste a row directly from Excel/Google Sheets</p>
                        <p>• Automatically detects tab, pipe (|), or comma separation</p>
                        <p>• Dates: MM/DD/YYYY or YYYY-MM-DD format</p>
                        <p>• Tags: separate with semicolons (;)</p>
                        <p>• Progress: number 0-100</p>
                        <p>• Owner Email must match existing user</p>
                        <p>
                          • <strong>Important:</strong> No line breaks within cells
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Input Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Paste single spreadsheet row here:</label>
                      <div className="text-xs text-gray-500">
                        {importData.length > 0 && `${importData.length} characters`}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Paste single spreadsheet row here..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      className="min-h-[200px] font-mono text-sm resize-none"
                    />
                  </div>

                  {/* Error Display */}
                  {importError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ScrollArea className="max-h-32">
                          <pre className="whitespace-pre-wrap text-xs">{importError}</pre>
                        </ScrollArea>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Display */}
                  {parsedData && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-green-800">✅ Data parsed successfully!</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Title:</span> {parsedData.title}
                            </div>
                            <div>
                              <span className="font-medium">Product Area:</span> {parsedData.productArea}
                            </div>
                            <div>
                              <span className="font-medium">Owner:</span>{" "}
                              {users.find((u) => u.id === parsedData.ownerId)?.name || "Not found"}
                            </div>
                            <div>
                              <span className="font-medium">Team:</span> {parsedData.team}
                            </div>
                            <div>
                              <span className="font-medium">Tier:</span> {parsedData.tier}
                            </div>
                            <div>
                              <span className="font-medium">Progress:</span> {parsedData.progress}%
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Add some bottom padding so content doesn't get hidden behind footer */}
                  <div className="h-4"></div>
                </div>
              </ScrollArea>

              {/* Fixed Footer */}
              <div className="border-t bg-gray-50 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {importData.trim() ? (
                      parsedData ? (
                        <span className="text-green-600 font-medium">✅ Ready to create initiative</span>
                      ) : (
                        <span>Data entered - click Parse to validate</span>
                      )
                    ) : (
                      <span>Paste single spreadsheet row above</span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSpreadsheetImport(false)
                        setImportData("")
                        setParsedData(null)
                        setImportError("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={parseSpreadsheetData}
                      disabled={!importData.trim()}
                      variant={importData.trim() ? "default" : "secondary"}
                    >
                      {parsedData ? "Re-parse Data" : "Parse Data"}
                    </Button>
                    {parsedData && (
                      <Button onClick={handleImportAndCreate} className="bg-green-600 hover:bg-green-700">
                        Create Initiative
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Initiative
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search initiatives, descriptions, owners, dates, tags, tier, progress, and more..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredInitiatives.length} of {initiatives.length} initiatives
        </p>
      )}

      {/* Initiatives List */}
      <InitiativesList
        initiatives={filteredInitiatives}
        onViewDetails={handleViewDetails}
        onEditInitiative={onEdit}
        onUpdateInitiative={onUpdateInitiative}
      />

      {/* Initiative Detail Modal */}
      {selectedInitiative && (
        <InitiativeDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          initiative={selectedInitiative}
          onEdit={onEdit}
        />
      )}
    </div>
  )
}

// Add global type declaration
declare global {
  interface Window {
    populateInitiativeForm?: (data: any) => void
  }
}
