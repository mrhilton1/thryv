"use client"

import { useState, useEffect, useMemo } from "react"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { useAdmin } from "@/contexts/admin-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Search, Download, FileSpreadsheet, AlertCircle, CheckCircle, Plus, Eye, EyeOff, UserPlus } from "lucide-react"
import { InitiativesList } from "./initiatives-list"
import { FieldMappingDialog } from "./field-mapping-dialog"
import { InitiativeDetailModal } from "./initiative-detail-modal"
import { fieldMappingService } from "@/lib/field-mapping-service"
import type { InitiativeWithRelations } from "@/lib/database/schemas"
import type { UnmappedField, FieldMapping, FieldVerification } from "@/lib/field-mapping-service"

interface InitiativesMasterListProps {
  onEdit: (initiative: InitiativeWithRelations) => void
  onCreate: (initialData?: any) => Promise<void>
  onExport: () => void
  onUpdateInitiative: (id: string, updates: any) => Promise<void>
}

export function InitiativesMasterList({ onEdit, onCreate, onExport, onUpdateInitiative }: InitiativesMasterListProps) {
  const { initiatives = [], users = [], refreshData, createUser } = useSupabaseDatabase()
  const { config, refreshConfig } = useAdmin()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [showSpreadsheetImport, setShowSpreadsheetImport] = useState(false)
  const [importData, setImportData] = useState("")
  const [importError, setImportError] = useState("")
  const [parsedData, setParsedData] = useState<any>(null)
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeWithRelations | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showColumnPreview, setShowColumnPreview] = useState(false)
  const [parsedColumns, setParsedColumns] = useState<string[]>([])
  const [importSuccess, setImportSuccess] = useState(false)

  // Field mapping states
  const [showFieldMapping, setShowFieldMapping] = useState(false)
  const [unmappedFields, setUnmappedFields] = useState<UnmappedField[]>([])
  const [allFieldVerifications, setAllFieldVerifications] = useState<FieldVerification[]>([])
  const [pendingData, setPendingData] = useState<any>(null)

  // User creation states
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [missingUserEmail, setMissingUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [creatingUser, setCreatingUser] = useState(false)
  const [userCreationAttempted, setUserCreationAttempted] = useState<Set<string>>(new Set())

  // Initialize field mapping service when component mounts
  useEffect(() => {
    const initializeFieldMapping = async () => {
      console.log("🔥 Initializing field mapping service...")
      await fieldMappingService.initialize()
      console.log("✅ Field mapping service initialized")
    }
    initializeFieldMapping()
  }, [])

  // Parse columns for preview whenever import data changes
  useEffect(() => {
    if (importData.trim()) {
      const cleanedData = importData.trim()
      // Split by tabs and preserve empty cells
      let values = cleanedData.split("\t")

      // If no tabs found, try other separators but still preserve empty values
      if (values.length === 1) {
        values = cleanedData.split(/\s{2,}/)
      }

      if (values.length === 1) {
        values = cleanedData.split("|")
      }

      // Clean up each value but preserve empty strings
      values = values.map((val) => {
        let cleaned = val.trim()
        // Remove quotes if they wrap the entire value
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.slice(1, -1)
        }
        return cleaned
      })

      setParsedColumns(values)
    } else {
      setParsedColumns([])
    }
  }, [importData])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => {
        setImportSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [importSuccess])

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !missingUserEmail.trim()) return

    setCreatingUser(true)
    try {
      console.log("Creating new user:", { name: newUserName, email: missingUserEmail })

      await createUser({
        name: newUserName.trim(),
        email: missingUserEmail.trim(),
        role: "user", // Default role
      })

      console.log("User created successfully")

      // Mark this email as attempted
      setUserCreationAttempted((prev) => new Set(prev).add(missingUserEmail))

      // Close the create user dialog first
      setShowCreateUser(false)
      setNewUserName("")

      // Clear the import error
      setImportError("")

      // Refresh users data and wait for it to complete
      console.log("Refreshing user data...")
      await refreshData()

      console.log("Users after refresh:", users.length)

      // Wait a bit more to ensure state is updated, then retry parsing
      setTimeout(() => {
        console.log("Auto-retrying parse after user creation...")
        parseSpreadsheetData()
      }, 1500) // Increased timeout to 1.5 seconds
    } catch (error) {
      console.error("Error creating user:", error)
      setImportError(`Error creating user: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setCreatingUser(false)
    }
  }

  const parseSpreadsheetData = async () => {
    try {
      setImportError("")

      if (!importData.trim()) {
        setImportError("Please paste some data to import")
        return
      }

      console.log("🔥 === PARSING SPREADSHEET DATA ===")
      console.log("🔥 Raw import data:", importData)
      console.log(
        "Available users:",
        users.map((u) => ({ id: u.id, email: u.email, name: u.name })),
      )

      // Clean up the input data and split by tabs
      const cleanedData = importData.trim()

      // Split by tabs first (most common from Excel/Google Sheets)
      let values = cleanedData.split("\t")

      // If no tabs found, try other separators
      if (values.length === 1) {
        // Try splitting by multiple spaces (2 or more)
        values = cleanedData.split(/\s{2,}/)
      }

      if (values.length === 1) {
        // Try splitting by pipes
        values = cleanedData.split("|")
      }

      // Clean up each value but PRESERVE empty strings for proper column alignment
      values = values.map((val) => {
        let cleaned = val.trim()
        // Remove quotes if they wrap the entire value
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.slice(1, -1)
        }
        return cleaned
      })

      // DO NOT filter out empty values - this was causing the column shift issue
      console.log("🔥 Parsed values (preserving empty cells):", values)
      console.log("🔥 Number of columns found:", values.length)

      // Expected column order (from the dialog instructions):
      // Title | Description | Goal | Product Area | Owner Email | Team | Tier | Status | Process Stage |
      // Priority | Business Impact | Start Date | Estimated Release Date | Actual Release Date | GTM Type |
      // Progress | Tags | Executive Update | Reason if not on track

      if (values.length < 6) {
        setImportError(`Not enough columns. Found ${values.length} columns, expected at least 6.

Detected columns:
${values.map((val, idx) => `${idx + 1}: "${val}"`).join("\n")}

Expected order: Title | Description | Goal | Product Area | Owner Email | Team | ...

Please ensure your data follows the expected column order.`)
        return
      }

      // Map values to the correct fields based on position - use || "" to handle empty strings
      const title = values[0] || ""
      const description = values[1] || ""
      const goal = values[2] || ""
      const productArea = values[3] || ""
      const ownerEmail = values[4] || ""
      const team = values[5] || ""
      const tier = values[6] || "1"
      const rawStatus = values[7] || "On Track" // KEEP ORIGINAL STATUS
      const processStage = values[8] || "Planned"
      const priority = values[9] || "Medium"
      const businessImpact = values[10] || "" // IMPORTANT: Keep empty to trigger field mapping
      const startDate = values[11] || ""
      const estimatedReleaseDate = values[12] || ""
      const actualReleaseDate = values[13] || ""
      const estimatedGtmType = values[14] || "" // IMPORTANT: Keep empty to trigger field mapping
      const progress = values[15] || "0"
      const tags = values[16] || ""
      const executiveUpdate = values[17] || ""
      const reasonIfNotOnTrack = values[18] || ""

      console.log("🔥 === MAPPED FIELDS DEBUG ===")
      console.log("🔥 Title:", title)
      console.log("🔥 Product Area:", productArea)
      console.log("🔥 Owner Email:", ownerEmail)
      console.log("🔥 Team:", team)
      console.log("🔥 RAW STATUS FROM IMPORT:", `"${rawStatus}"`)
      console.log("🔥 Priority:", `"${priority}"`)
      console.log("🔥 Business Impact:", `"${businessImpact}"`) // Show quotes to see if it's empty
      console.log("🔥 GTM Type:", `"${estimatedGtmType}"`) // Show quotes to see if it's empty
      console.log("🔥 === END MAPPED FIELDS DEBUG ===")

      // Safely find owner by email
      let owner = null
      if (ownerEmail && typeof ownerEmail === "string" && ownerEmail.trim() !== "") {
        console.log(`Looking for user with email: "${ownerEmail}"`)
        owner = users.find((u) => {
          if (!u || !u.email) return false
          const match = u.email.toLowerCase() === ownerEmail.toLowerCase()
          console.log(`Comparing "${u.email}" with "${ownerEmail}": ${match}`)
          return match
        })

        console.log("Found owner:", owner)

        if (!owner) {
          // Only show create user option if we haven't already attempted to create this user
          // and we're not currently showing the create user dialog
          if (!userCreationAttempted.has(ownerEmail) && !showCreateUser) {
            console.log("User not found, showing create user dialog")
            setMissingUserEmail(ownerEmail)
            setNewUserName("") // Clear previous name
            setShowCreateUser(true)
          }

          setImportError(
            `Owner with email "${ownerEmail}" not found. Available users: ${users
              .filter((u) => u && u.email)
              .map((u) => u.email)
              .join(", ")}`,
          )
          return
        } else {
          // Clear the missing user email and creation attempt since we found the user
          setMissingUserEmail("")
          setUserCreationAttempted((prev) => {
            const newSet = new Set(prev)
            newSet.delete(ownerEmail)
            return newSet
          })
        }
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

      // AGGRESSIVE FIX: Define valid status values and preserve original if valid
      const VALID_STATUSES = [
        "On Track",
        "At Risk",
        "Off Track",
        "Complete",
        "Cancelled",
        "Paused",
        "Blocked",
        "Deprioritized",
      ]
      let finalStatus = rawStatus

      // If the raw status is valid, keep it. Otherwise default to "On Track"
      if (!VALID_STATUSES.includes(rawStatus)) {
        console.log(`⚠️ Invalid status "${rawStatus}", defaulting to "On Track"`)
        finalStatus = "On Track"
      } else {
        console.log(`✅ Valid status "${rawStatus}", keeping original`)
      }

      // AGGRESSIVE FIX: Define valid priority values and validate
      const VALID_PRIORITIES = ["Low", "Medium", "High", "Critical"]
      let finalPriority = priority

      // If the priority is not valid, default to "Medium"
      if (!VALID_PRIORITIES.includes(priority)) {
        console.log(`⚠️ Invalid priority "${priority}", defaulting to "Medium"`)
        finalPriority = "Medium"

        // If the priority field contains something that looks like it should be business impact,
        // move it there and clear priority
        if (priority && !businessImpact) {
          console.log(`🔄 Moving "${priority}" from priority to business impact`)
          // Don't auto-assign it, let field mapping handle it
        }
      } else {
        console.log(`✅ Valid priority "${priority}", keeping original`)
      }

      const parsed = {
        title: title,
        description: description,
        goal: goal,
        productArea: productArea,
        ownerId: owner?.id || "",
        team: team,
        tier: tier ? Number.parseInt(tier) || 1 : 1,
        status: finalStatus, // Use the validated status
        processStage: processStage,
        priority: finalPriority, // Use the validated priority
        businessImpact: businessImpact, // Keep as-is, even if empty - this will trigger field mapping
        startDate: startDate ? formatDateForInput(startDate) : "",
        estimatedReleaseDate: estimatedReleaseDate ? formatDateForInput(estimatedReleaseDate) : "",
        actualReleaseDate: actualReleaseDate ? formatDateForInput(actualReleaseDate) : "",
        estimatedGtmType: estimatedGtmType, // Keep as-is, even if empty - this will trigger field mapping
        progress: progress ? Number.parseInt(progress) || 0 : 0,
        tags: tags
          ? tags
              .split(";")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        executiveUpdate: executiveUpdate,
        reasonIfNotOnTrack: reasonIfNotOnTrack,
        attachments: [],
      }

      console.log("🔥 Final parsed data BEFORE field mapping:", parsed)

      // AGGRESSIVE FIX: DO NOT apply field mappings to status if it's already valid
      console.log("🔥 === APPLYING FIELD MAPPINGS (EXCLUDING VALID STATUS) ===")

      // Create a copy for mapping but preserve the original status if valid
      const dataForMapping = { ...parsed }
      const originalStatus = dataForMapping.status
      const originalPriority = dataForMapping.priority

      // Apply stored field mappings but skip status if it's valid
      const mappedData = await fieldMappingService.applyStoredMappings(dataForMapping)

      // FORCE the original status and priority back if they were valid
      if (VALID_STATUSES.includes(originalStatus)) {
        console.log(`🔥 FORCING original status "${originalStatus}" back after mapping`)
        mappedData.status = originalStatus
      }

      if (VALID_PRIORITIES.includes(originalPriority)) {
        console.log(`🔥 FORCING original priority "${originalPriority}" back after mapping`)
        mappedData.priority = originalPriority
      }

      console.log("🔥 Data after applying stored mappings:", mappedData)

      // ALWAYS show field verification dialog after parsing
      console.log("🔥 === VERIFYING ALL FIELDS ===")
      console.log("Config object:", config)

      // Get all field verifications (both valid and invalid)
      const allVerifications = fieldMappingService.verifyAllFields(mappedData, config)
      console.log("All field verifications:", allVerifications)

      // Get only unmapped fields for the issues tab
      const unmapped = fieldMappingService.detectUnmappedFields(mappedData, config)
      console.log("Unmapped fields detected:", unmapped)

      // FORCE Business Impact and GTM Type to be included if they're empty or invalid
      const forceIncludeFields = ["businessImpact", "estimatedGtmType"]
      forceIncludeFields.forEach((fieldName) => {
        const fieldValue = mappedData[fieldName]
        const hasVerification = allVerifications.some((v) => v.fieldName === fieldName)
        const hasUnmapped = unmapped.some((u) => u.fieldName === fieldName)

        console.log(
          `Checking force include for ${fieldName}: value="${fieldValue}", hasVerification=${hasVerification}, hasUnmapped=${hasUnmapped}`,
        )

        if (!hasUnmapped && (!fieldValue || fieldValue.trim() === "")) {
          console.log(`Force adding ${fieldName} to unmapped fields`)

          // Get available options for this field
          const availableOptions = fieldMappingService.getAvailableOptionsForField(fieldName, config)

          unmapped.push({
            fieldName: fieldName,
            value: fieldValue || "",
            availableOptions: availableOptions,
            category: fieldName === "businessImpact" ? "business_impacts" : "gtm_types",
          })
        }
      })

      console.log("Final unmapped fields after force include:", unmapped)

      // Always show the field mapping dialog for verification
      setAllFieldVerifications(allVerifications)
      setUnmappedFields(unmapped)
      setPendingData(mappedData)
      setShowFieldMapping(true)
    } catch (error) {
      console.error("Error parsing spreadsheet data:", error)
      setImportError(`Error parsing data: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleFieldMappingsComplete = async (mappings: FieldMapping[]) => {
    try {
      console.log("🔥 === HANDLING FIELD MAPPINGS COMPLETE ===")
      console.log("🔥 Saving field mappings:", mappings)
      console.log("🔥 Current user:", user)

      // Add user ID to mappings - handle the UUID properly
      const mappingsWithUser = mappings.map((mapping) => ({
        ...mapping,
        // Only add createdBy if we have a valid user with a proper UUID
        createdBy: user?.id && typeof user.id === "string" && user.id.length > 10 ? user.id : undefined,
      }))

      console.log("🔥 Mappings with user:", mappingsWithUser)

      // Save the mappings to the database (this will also create new config items)
      let newConfigItems: any[] = []
      if (mappingsWithUser.length > 0) {
        newConfigItems = await fieldMappingService.saveMappings(mappingsWithUser)
        console.log("✅ Field mappings saved successfully, new config items:", newConfigItems)

        // Refresh the admin config to get the newly created config items
        console.log("🔄 Refreshing admin config...")
        await refreshConfig()

        // Also refresh the database data to ensure everything is up to date
        console.log("🔄 Refreshing database data...")
        await refreshData()

        // Wait a bit for the refresh to complete
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Apply the mappings to the pending data
      const finalData = { ...pendingData }

      mappings.forEach((mapping) => {
        if (mapping.targetType === "skip") {
          // Remove skipped fields
          delete finalData[mapping.fieldName]
        } else if (finalData[mapping.fieldName] === mapping.sourceValue) {
          finalData[mapping.fieldName] = mapping.targetValue
        }
      })

      console.log("🔥 Final data after mappings:", finalData)

      // AGGRESSIVE FIX: Validate status field and preserve valid values
      const VALID_STATUSES = [
        "On Track",
        "At Risk",
        "Off Track",
        "Complete",
        "Cancelled",
        "Paused",
        "Blocked",
        "Deprioritized",
      ]
      if (finalData.status && !VALID_STATUSES.includes(finalData.status)) {
        console.log("⚠️ Invalid status detected, defaulting to 'On Track'")
        finalData.status = "On Track"
      }

      // AGGRESSIVE FIX: Validate priority field
      const VALID_PRIORITIES = ["Low", "Medium", "High", "Critical"]
      if (finalData.priority && !VALID_PRIORITIES.includes(finalData.priority)) {
        console.log("⚠️ Invalid priority detected, defaulting to 'Medium'")
        finalData.priority = "Medium"
      }

      // Close the field mapping dialog first
      setShowFieldMapping(false)
      setUnmappedFields([])
      setAllFieldVerifications([])
      setPendingData(null)

      // DIRECTLY CREATE THE INITIATIVE HERE
      try {
        console.log("🚀 Creating initiative with final data:", finalData)
        await onCreate(finalData)

        // Show success message
        setImportSuccess(true)

        // COMPLETE FORM RESET - Clear all form state for next import
        setImportData("")
        setParsedData(null)
        setImportError("")
        setShowColumnPreview(false)
        setParsedColumns([])
        setMissingUserEmail("")
        setNewUserName("")
        setUserCreationAttempted(new Set())

        console.log("✅ Initiative created successfully via field mapping, form reset for next import")
      } catch (error) {
        console.error("❌ Error creating initiative:", error)
        setImportError(`Error creating initiative: ${error instanceof Error ? error.message : "Unknown error"}`)
      }

      console.log("🔥 === FIELD MAPPINGS COMPLETE FINISHED ===")
    } catch (error) {
      console.error("❌ Error saving field mappings:", error)
      setImportError(`Error saving field mappings: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleImportAndCreate = async () => {
    if (parsedData) {
      try {
        // Create the initiative
        await onCreate(parsedData)

        // Show success message
        setImportSuccess(true)

        // Clear all form state for next import
        setImportData("")
        setParsedData(null)
        setImportError("")
        setShowColumnPreview(false)
        setParsedColumns([])
        setMissingUserEmail("")
        setNewUserName("")
        setUserCreationAttempted(new Set())

        // Keep the dialog open for next import
        // setShowSpreadsheetImport(false) - DON'T close the dialog

        console.log("Initiative created successfully, ready for next import")
      } catch (error) {
        console.error("Error creating initiative:", error)
        setImportError(`Error creating initiative: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
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

  const expectedColumns = [
    "Title",
    "Description",
    "Goal",
    "Product Area",
    "Owner Email",
    "Team",
    "Tier",
    "Status",
    "Process Stage",
    "Priority",
    "Business Impact",
    "Start Date",
    "Estimated Release Date",
    "Actual Release Date",
    "GTM Type",
    "Progress",
    "Tags",
    "Executive Update",
    "Reason if not on track",
  ]

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
            <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
              {/* Fixed Header */}
              <DialogHeader className="px-6 py-4 border-b shrink-0">
                <DialogTitle>Import Initiative from Spreadsheet</DialogTitle>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <ScrollArea className="flex-1 px-6">
                <div className="py-4 space-y-6">
                  {/* Success Message */}
                  {importSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-green-800">✅ Initiative created successfully!</p>
                          <p className="text-sm text-green-700">
                            Ready to import the next initiative. Paste new data below.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

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
                        <p>• Empty cells are preserved to maintain column alignment</p>
                        <p>• Dates: MM/DD/YYYY or YYYY-MM-DD format</p>
                        <p>• Tags: separate with semicolons (;)</p>
                        <p>• Progress: number 0-100</p>
                        <p>• Owner Email must match existing user</p>
                        <p>
                          • Status: On Track, At Risk, Off Track, Complete, Cancelled, Paused, Blocked, Deprioritized
                        </p>
                        <p>• Priority: Low, Medium, High, Critical</p>
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
                      <div className="flex items-center gap-2">
                        {parsedColumns.length > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setShowColumnPreview(!showColumnPreview)}>
                            {showColumnPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                            {showColumnPreview ? "Hide" : "Show"} Column Preview
                          </Button>
                        )}
                        <div className="text-xs text-gray-500">
                          {importData.length > 0 && `${importData.length} characters`}
                        </div>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Paste single spreadsheet row here..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      className="min-h-[200px] font-mono text-sm resize-none"
                    />
                  </div>

                  {/* Column Preview */}
                  {showColumnPreview && parsedColumns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Column Preview ({parsedColumns.length} columns detected)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {parsedColumns.map((value, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 py-1 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="w-6 text-xs text-gray-500 font-mono">{index + 1}</div>
                              <div className="w-32 text-xs font-medium text-gray-700 truncate">
                                {expectedColumns[index] || `Column ${index + 1}`}
                              </div>
                              <div className="flex-1 text-xs font-mono bg-gray-50 px-2 py-1 rounded border min-h-[24px]">
                                {value === "" ? (
                                  <span className="text-gray-400 italic">(empty)</span>
                                ) : (
                                  <span className="text-gray-900">{value}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {parsedColumns.length !== expectedColumns.length && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            ⚠️ Expected {expectedColumns.length} columns, found {parsedColumns.length}.
                            {parsedColumns.length < expectedColumns.length
                              ? " Some columns may be missing."
                              : " Extra columns will be ignored."}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Error Display with Create User Option */}
                  {importError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-3">
                          <ScrollArea className="max-h-32">
                            <pre className="whitespace-pre-wrap text-xs">{importError}</pre>
                          </ScrollArea>
                          {missingUserEmail && !showCreateUser && !userCreationAttempted.has(missingUserEmail) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCreateUser(true)}
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Create User: {missingUserEmail}
                            </Button>
                          )}
                        </div>
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
                              {users.find((u) => u?.id === parsedData.ownerId)?.name || "Not found"}
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
                        setShowColumnPreview(false)
                        setParsedColumns([])
                        setMissingUserEmail("")
                        setNewUserName("")
                        setUserCreationAttempted(new Set())
                        setImportSuccess(false)
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

          <Button onClick={() => onCreate()}>
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

      {/* Field Mapping Dialog - Now includes all field verifications */}
      <FieldMappingDialog
        open={showFieldMapping}
        onOpenChange={setShowFieldMapping}
        unmappedFields={unmappedFields}
        onMappingsComplete={handleFieldMappingsComplete}
        importData={pendingData}
        allFieldVerifications={allFieldVerifications}
      />

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Create New User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email Address</Label>
              <Input
                id="userEmail"
                type="email"
                value={missingUserEmail}
                onChange={(e) => setMissingUserEmail(e.target.value)}
                placeholder="user@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName">Full Name</Label>
              <Input
                id="userName"
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter user's full name"
              />
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                This will create a new user account that can be assigned as an initiative owner.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)} disabled={creatingUser}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUserName.trim() || !missingUserEmail.trim() || creatingUser}
            >
              {creatingUser ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add global type declaration
declare global {
  interface Window {
    populateInitiativeForm?: (data: any) => void
  }
}
