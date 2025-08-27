"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Target, CalendarIcon, Settings, ChevronDown, ChevronRight, X, Plus, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { useAuth } from "@/contexts/auth-context"

interface InitiativeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initiative?: any
  users?: any[]
  config?: any
  onSave: (data: any) => void
  initialData?: any
}

export function InitiativeForm({
  open,
  onOpenChange,
  initiative,
  users = [],
  config,
  onSave,
  initialData,
}: InitiativeFormProps) {
  const { user } = useAuth()
  const { configItems, fieldConfigurations } = useSupabaseDatabase()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    executiveUpdate: "",
    productArea: "",
    ownerId: "",
    team: "",
    tier: 1,
    status: "On Track",
    processStage: "Planned",
    priority: "Medium",
    businessImpact: "Increase Revenue",
    startDate: "",
    estimatedReleaseDate: "",
    actualReleaseDate: "",
    estimatedGTMType: "Soft Launch",
    progress: 0,
    tags: [] as string[],
    reasonIfNotOnTrack: "",
    showOnExecutiveSummary: false,
  })

  // UI state
  const [basicInfoOpen, setBasicInfoOpen] = useState(true)
  const [statusProgressOpen, setStatusProgressOpen] = useState(false)
  const [timelineDatesOpen, setTimelineDatesOpen] = useState(false)
  const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper function to get field configuration
  const getFieldConfig = (fieldName: string) => {
    const allFields = [
      ...fieldConfigurations.basicInformation,
      ...fieldConfigurations.statusProgress,
      ...fieldConfigurations.timelineDates,
      ...fieldConfigurations.additionalDetails,
    ]
    return allFields.find((field) => field.fieldName === fieldName)
  }

  // Helper function to check if field is required
  const isFieldRequired = (fieldName: string) => {
    const config = getFieldConfig(fieldName)
    return config?.isRequired || false
  }

  // Helper function to get default value for field
  const getFieldDefault = (fieldName: string) => {
    const config = getFieldConfig(fieldName)
    if (!config?.hasDefault || !config?.defaultValue) return null

    // For select fields, find the label from config items
    switch (fieldName) {
      case "productArea":
        return configItems.productAreas?.find((item) => item.id === config.defaultValue)?.label || null
      case "team":
        return configItems.teams?.find((item) => item.id === config.defaultValue)?.label || null
      case "status":
        return configItems.statuses?.find((item) => item.id === config.defaultValue)?.label || null
      case "processStage":
        return configItems.processStages?.find((item) => item.id === config.defaultValue)?.label || null
      case "priority":
        return configItems.priorities?.find((item) => item.id === config.defaultValue)?.label || null
      case "businessImpact":
        return configItems.businessImpacts?.find((item) => item.id === config.defaultValue)?.label || null
      case "estimatedGtmType":
        return configItems.gtmTypes?.find((item) => item.id === config.defaultValue)?.label || null
      case "tier":
        return Number.parseInt(config.defaultValue) || null
      default:
        return config.defaultValue
    }
  }

  // Helper function to parse dates intelligently
  const parseSmartDate = (dateString: string): string => {
    if (!dateString || typeof dateString !== "string") return ""

    try {
      // Handle various date formats
      let parsedDate: Date | null = null

      // Clean the input string
      const cleanDateString = dateString.trim()

      // Try different date formats
      const formats = [
        // MM/DD/YY or MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
        // MM-DD-YY or MM-DD-YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
        // YYYY-MM-DD
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      ]

      for (const format of formats) {
        const match = cleanDateString.match(format)
        if (match) {
          const [, part1, part2, part3] = match
          let month: number, day: number, year: number

          if (format === formats[2]) {
            // YYYY-MM-DD format
            year = Number.parseInt(part1)
            month = Number.parseInt(part2)
            day = Number.parseInt(part3)
          } else {
            // MM/DD/YY or MM-DD-YY format
            month = Number.parseInt(part1)
            day = Number.parseInt(part2)
            year = Number.parseInt(part3)

            // Handle 2-digit years more intelligently
            if (year < 100) {
              const currentYear = new Date().getFullYear()
              const currentTwoDigitYear = currentYear % 100

              // If the 2-digit year is within 10 years of current year, use current century
              // Otherwise, if it's much smaller, assume next century
              if (year <= currentTwoDigitYear + 10) {
                year = Math.floor(currentYear / 100) * 100 + year
              } else {
                // For years like 25 when current year is 2024, assume 2025
                year = Math.floor(currentYear / 100) * 100 + year
              }
            }
          }

          // Validate the date components
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000) {
            // Create date in local timezone to avoid timezone shifts
            parsedDate = new Date(year, month - 1, day)

            // Verify the date is valid (handles invalid dates like Feb 30)
            if (
              parsedDate.getFullYear() === year &&
              parsedDate.getMonth() === month - 1 &&
              parsedDate.getDate() === day
            ) {
              break
            } else {
              parsedDate = null
            }
          }
        }
      }

      // If no format matched, try native Date parsing as fallback
      if (!parsedDate) {
        parsedDate = new Date(cleanDateString)
        if (isNaN(parsedDate.getTime())) {
          return ""
        }

        // If the parsed date is before 2000, assume it's a 2-digit year issue
        if (parsedDate.getFullYear() < 2000) {
          const currentYear = new Date().getFullYear()
          const adjustedYear = Math.floor(currentYear / 100) * 100 + (parsedDate.getFullYear() % 100)
          parsedDate = new Date(adjustedYear, parsedDate.getMonth(), parsedDate.getDate())
        }
      }

      // Return in YYYY-MM-DD format for input fields, using local timezone
      const year = parsedDate.getFullYear()
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
      const day = String(parsedDate.getDate()).padStart(2, "0")

      return `${year}-${month}-${day}`
    } catch (error) {
      console.error("Error parsing date:", dateString, error)
      return ""
    }
  }

  // Reset form when modal opens/closes or initiative changes
  useEffect(() => {
    console.log("🔧 InitiativeForm useEffect triggered")
    console.log("🔧 open:", open)
    console.log("🔧 initiative:", initiative)
    console.log("🔧 initialData:", initialData)

    if (open) {
      if (initiative) {
        console.log("🔧 Edit mode - populating with existing data")
        // Edit mode - populate with existing data
        setFormData({
          title: initiative.title || "",
          description: initiative.description || "",
          goal: initiative.goal || "",
          executiveUpdate: initiative.executiveUpdate || "",
          productArea: initiative.productArea || "",
          ownerId: initiative.ownerId || "",
          team: initiative.team || "",
          tier: initiative.tier || 1,
          status: initiative.status || "On Track",
          processStage: initiative.processStage || "Planned",
          priority: initiative.priority || "Medium",
          businessImpact: initiative.businessImpact || "Increase Revenue",
          startDate: initiative.startDate || "",
          estimatedReleaseDate: initiative.estimatedReleaseDate || "",
          actualReleaseDate: initiative.actualReleaseDate || "",
          estimatedGTMType: initiative.estimatedGTMType || "Soft Launch",
          progress: initiative.progress || 0,
          tags: initiative.tags || [],
          reasonIfNotOnTrack: initiative.reasonIfNotOnTrack || "",
          showOnExecutiveSummary: initiative.showOnExecutiveSummary || false,
        })
        console.log("🔧 Form data set for editing")
      } else if (initialData) {
        console.log("🔧 Create mode with initial data")
        // Parse dates intelligently
        const startDate = parseSmartDate(initialData.startDate)
        const estimatedReleaseDate = parseSmartDate(initialData.estimatedReleaseDate)
        const actualReleaseDate = parseSmartDate(initialData.actualReleaseDate)

        console.log("Parsed dates:", { startDate, estimatedReleaseDate, actualReleaseDate })

        setFormData({
          title: initialData.title || "",
          description: initialData.description || "",
          goal: initialData.goal || "",
          executiveUpdate: initialData.executiveUpdate || "",
          productArea: initialData.productArea || "",
          ownerId: initialData.ownerId || user?.id || "",
          team: initialData.team || "",
          tier: initialData.tier || 1,
          status: initialData.status || "On Track",
          processStage: initialData.processStage || "Planned",
          priority: initialData.priority || "Medium",
          businessImpact: initialData.businessImpact || "Increase Revenue",
          startDate: startDate,
          estimatedReleaseDate: estimatedReleaseDate,
          actualReleaseDate: actualReleaseDate,
          estimatedGTMType: initialData.estimatedGTMType || initialData.estimatedGtmType || "Soft Launch",
          progress: initialData.progress || 0,
          tags: initialData.tags || [],
          reasonIfNotOnTrack: initialData.reasonIfNotOnTrack || "",
          showOnExecutiveSummary: initialData.showOnExecutiveSummary || false,
        })

        console.log("Final form data set:", {
          businessImpact: initialData.businessImpact || "Increase Revenue",
          status: initialData.status || "On Track",
          estimatedGTMType: initialData.estimatedGTMType || initialData.estimatedGtmType || "Soft Launch",
        })
      } else {
        console.log("🔧 Create mode - using defaults")
        // Create mode - reset to defaults with field configuration defaults
        const defaultFormData = {
          title: getFieldDefault("title") || "",
          description: getFieldDefault("description") || "",
          goal: getFieldDefault("goal") || "",
          executiveUpdate: getFieldDefault("executiveUpdate") || "",
          productArea: getFieldDefault("productArea") || "",
          ownerId: user?.id || "",
          team: getFieldDefault("team") || "",
          tier: getFieldDefault("tier") || 1,
          status: getFieldDefault("status") || "On Track",
          processStage: getFieldDefault("processStage") || "Planned",
          priority: getFieldDefault("priority") || "Medium",
          businessImpact: getFieldDefault("businessImpact") || "Increase Revenue",
          startDate: getFieldDefault("startDate") || "",
          estimatedReleaseDate: getFieldDefault("estimatedReleaseDate") || "",
          actualReleaseDate: getFieldDefault("actualReleaseDate") || "",
          estimatedGTMType: getFieldDefault("estimatedGtmType") || "Soft Launch",
          progress: getFieldDefault("progress") || 0,
          tags: [],
          reasonIfNotOnTrack: getFieldDefault("reasonIfNotOnTrack") || "",
          showOnExecutiveSummary: getFieldDefault("showOnExecutiveSummary") || false,
        }

        setFormData(defaultFormData)
      }
      setErrors({})
      setBasicInfoOpen(true)
      setStatusProgressOpen(false)
      setTimelineDatesOpen(false)
      setAdditionalDetailsOpen(false)
    }
  }, [open, initiative, initialData, user, fieldConfigurations, configItems])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Check all fields for required validation based on field configurations
    const fieldsToCheck = [
      { key: "title", label: "Initiative title" },
      { key: "description", label: "Project description" },
      { key: "goal", label: "Goal" },
      { key: "executiveUpdate", label: "Executive update" },
      { key: "productArea", label: "Product area" },
      { key: "ownerId", label: "Initiative owner" },
      { key: "team", label: "Team" },
      { key: "tier", label: "Tier" },
      { key: "status", label: "Status" },
      { key: "processStage", label: "Process stage" },
      { key: "priority", label: "Priority" },
      { key: "businessImpact", label: "Business impact" },
      { key: "startDate", label: "Start date" },
      { key: "estimatedReleaseDate", label: "Estimated release date" },
      { key: "actualReleaseDate", label: "Actual release date" },
      { key: "estimatedGtmType", label: "GTM type" },
      { key: "progress", label: "Progress" },
      { key: "reasonIfNotOnTrack", label: "Reason if not on track" },
    ]

    fieldsToCheck.forEach(({ key, label }) => {
      if (isFieldRequired(key)) {
        const value = formData[key as keyof typeof formData]
        if (!value || (typeof value === "string" && !value.trim())) {
          newErrors[key] = `${label} is required`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      // Find the first error and open the appropriate section
      const errorKeys = Object.keys(errors)
      if (errorKeys.length > 0) {
        const firstErrorField = errorKeys[0]

        // Determine which section contains the error
        const basicInfoFields = [
          "title",
          "description",
          "goal",
          "executiveUpdate",
          "productArea",
          "ownerId",
          "team",
          "tier",
        ]
        const statusProgressFields = [
          "status",
          "processStage",
          "priority",
          "businessImpact",
          "progress",
          "reasonIfNotOnTrack",
        ]
        const timelineDatesFields = ["startDate", "estimatedReleaseDate", "actualReleaseDate", "estimatedGTMType"]
        const additionalDetailsFields = ["tags"]

        if (basicInfoFields.includes(firstErrorField)) {
          setBasicInfoOpen(true)
        } else if (statusProgressFields.includes(firstErrorField)) {
          setStatusProgressOpen(true)
        } else if (timelineDatesFields.includes(firstErrorField)) {
          setTimelineDatesOpen(true)
        } else if (additionalDetailsFields.includes(firstErrorField)) {
          setAdditionalDetailsOpen(true)
        }

        // Focus on the first error field after a short delay to allow section to open
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField)
          if (errorElement) {
            errorElement.focus()
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }, 100)
      }
      return
    }

    onSave(formData)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (date) {
      // Use local timezone to avoid day-shifting issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const dateString = `${year}-${month}-${day}`

      console.log(`Setting ${field} to:`, dateString, "from date object:", date)
      handleInputChange(field, dateString)
    } else {
      handleInputChange(field, "")
    }
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  // Helper function to determine if "Reason if not on track" should be shown
  const shouldShowReasonField = () => {
    const statusesToShow = ["At Risk", "Off Track", "Deprioritized", "Cancelled", "Paused"]
    return statusesToShow.includes(formData.status)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-gray-100">
        <DialogHeader className="px-6 py-4 bg-white border-b">
          <DialogTitle className="text-xl font-semibold">
            {initiative ? "Edit Initiative" : "Create New Initiative"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {/* Basic Information Section */}
            <Collapsible open={basicInfoOpen} onOpenChange={setBasicInfoOpen}>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-4 h-auto hover:bg-blue-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-blue-900">Basic Information</div>
                        <div className="text-sm text-blue-700">Core details about the initiative</div>
                      </div>
                    </div>
                    <div className="ml-auto">
                      {basicInfoOpen ? (
                        <ChevronDown className="w-4 h-4 text-blue-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-blue-700" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-6 bg-white border-t border-blue-200 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="title" className="text-sm font-medium">
                          Initiative Title {isFieldRequired("title") && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="title"
                          placeholder="Enter initiative title"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          className={cn("mt-1", errors.title && "border-red-500")}
                        />
                        {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-medium">
                          Project Description{" "}
                          {isFieldRequired("description") && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what this initiative will accomplish"
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          rows={3}
                          className={cn("mt-1", errors.description && "border-red-500")}
                        />
                        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
                      </div>

                      <div>
                        <Label htmlFor="goal" className="text-sm font-medium">
                          Goal {isFieldRequired("goal") && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                          id="goal"
                          placeholder="What specific goals will this initiative achieve?"
                          value={formData.goal}
                          onChange={(e) => handleInputChange("goal", e.target.value)}
                          rows={2}
                          className={cn("mt-1", errors.goal && "border-red-500")}
                        />
                        {errors.goal && <p className="text-sm text-red-500 mt-1">{errors.goal}</p>}
                      </div>

                      <div>
                        <Label htmlFor="executiveUpdate" className="text-sm font-medium">
                          Executive Update{" "}
                          {isFieldRequired("executiveUpdate") && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                          id="executiveUpdate"
                          placeholder="Provide an update statement for the executive committee..."
                          value={formData.executiveUpdate}
                          onChange={(e) => handleInputChange("executiveUpdate", e.target.value)}
                          rows={2}
                          className={cn("mt-1", errors.executiveUpdate && "border-red-500")}
                        />
                        {errors.executiveUpdate && (
                          <p className="text-sm text-red-500 mt-1">{errors.executiveUpdate}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="productArea" className="text-sm font-medium">
                          Product Area {isFieldRequired("productArea") && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={formData.productArea}
                          onValueChange={(value) => handleInputChange("productArea", value)}
                        >
                          <SelectTrigger className={cn("mt-1", errors.productArea && "border-red-500")}>
                            <SelectValue placeholder="Select product area" />
                          </SelectTrigger>
                          <SelectContent>
                            {configItems?.productAreas?.map((area) => (
                              <SelectItem key={area.id} value={area.label}>
                                {area.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.productArea && <p className="text-sm text-red-500 mt-1">{errors.productArea}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="ownerId" className="text-sm font-medium">
                            Initiative Owner {isFieldRequired("ownerId") && <span className="text-red-500">*</span>}
                          </Label>
                          <Select
                            value={formData.ownerId}
                            onValueChange={(value) => handleInputChange("ownerId", value)}
                          >
                            <SelectTrigger className={cn("mt-1", errors.ownerId && "border-red-500")}>
                              <SelectValue placeholder="Select owner" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.ownerId && <p className="text-sm text-red-500 mt-1">{errors.ownerId}</p>}
                        </div>

                        <div>
                          <Label htmlFor="team" className="text-sm font-medium">
                            Team {isFieldRequired("team") && <span className="text-red-500">*</span>}
                          </Label>
                          <Select value={formData.team} onValueChange={(value) => handleInputChange("team", value)}>
                            <SelectTrigger className={cn("mt-1", errors.team && "border-red-500")}>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                            <SelectContent>
                              {configItems?.teams?.map((team) => (
                                <SelectItem key={team.id} value={team.label}>
                                  {team.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.team && <p className="text-sm text-red-500 mt-1">{errors.team}</p>}
                        </div>

                        <div>
                          <Label htmlFor="tier" className="text-sm font-medium">
                            Tier {isFieldRequired("tier") && <span className="text-red-500">*</span>}
                          </Label>
                          <Select
                            value={formData.tier.toString()}
                            onValueChange={(value) => handleInputChange("tier", Number.parseInt(value))}
                          >
                            <SelectTrigger className={cn("mt-1", errors.tier && "border-red-500")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.tier && <p className="text-sm text-red-500 mt-1">{errors.tier}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Status & Progress Section */}
            <Collapsible open={statusProgressOpen} onOpenChange={setStatusProgressOpen}>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-4 h-auto hover:bg-orange-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-orange-900">Status & Progress</div>
                        <div className="text-sm text-orange-700">Current status and progress tracking</div>
                      </div>
                    </div>
                    <div className="ml-auto">
                      {statusProgressOpen ? (
                        <ChevronDown className="w-4 h-4 text-orange-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-orange-700" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-6 bg-white border-t border-orange-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium">
                          Status {isFieldRequired("status") && <span className="text-red-500">*</span>}
                        </Label>
                        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                          <SelectTrigger className={cn("mt-1", errors.status && "border-red-500")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {configItems?.statuses?.map((status) => (
                              <SelectItem key={status.id} value={status.label}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status}</p>}
                      </div>

                      <div>
                        <Label htmlFor="processStage" className="text-sm font-medium">
                          Process Stage {isFieldRequired("processStage") && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={formData.processStage}
                          onValueChange={(value) => handleInputChange("processStage", value)}
                        >
                          <SelectTrigger className={cn("mt-1", errors.processStage && "border-red-500")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {configItems?.processStages?.map((stage) => (
                              <SelectItem key={stage.id} value={stage.label}>
                                {stage.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.processStage && <p className="text-sm text-red-500 mt-1">{errors.processStage}</p>}
                      </div>

                      <div>
                        <Label htmlFor="priority" className="text-sm font-medium">
                          Priority {isFieldRequired("priority") && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => handleInputChange("priority", value)}
                        >
                          <SelectTrigger className={cn("mt-1", errors.priority && "border-red-500")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {configItems?.priorities?.map((priority) => (
                              <SelectItem key={priority.id} value={priority.label}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.priority && <p className="text-sm text-red-500 mt-1">{errors.priority}</p>}
                      </div>

                      <div>
                        <Label htmlFor="businessImpact" className="text-sm font-medium">
                          Business Impact {isFieldRequired("businessImpact") && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={formData.businessImpact}
                          onValueChange={(value) => handleInputChange("businessImpact", value)}
                        >
                          <SelectTrigger className={cn("mt-1", errors.businessImpact && "border-red-500")}>
                            <SelectValue placeholder="Select business impact" />
                          </SelectTrigger>
                          <SelectContent>
                            {configItems?.businessImpacts?.map((impact) => (
                              <SelectItem key={impact.id} value={impact.label}>
                                {impact.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.businessImpact && <p className="text-sm text-red-500 mt-1">{errors.businessImpact}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="progress" className="text-sm font-medium">
                        Progress ({formData.progress}%){" "}
                        {isFieldRequired("progress") && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => handleInputChange("progress", Number.parseInt(e.target.value) || 0)}
                        className={cn("mt-1", errors.progress && "border-red-500")}
                      />
                      {errors.progress && <p className="text-sm text-red-500 mt-1">{errors.progress}</p>}
                    </div>

                    {/* CONDITIONAL: Only show "Reason if not on track" for specific statuses */}
                    {shouldShowReasonField() && (
                      <div>
                        <Label htmlFor="reasonIfNotOnTrack" className="text-sm font-medium">
                          Reason if not on track{" "}
                          {isFieldRequired("reasonIfNotOnTrack") && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                          id="reasonIfNotOnTrack"
                          placeholder="Explain why this initiative is not on track..."
                          value={formData.reasonIfNotOnTrack}
                          onChange={(e) => handleInputChange("reasonIfNotOnTrack", e.target.value)}
                          rows={2}
                          className={cn("mt-1", errors.reasonIfNotOnTrack && "border-red-500")}
                        />
                        {errors.reasonIfNotOnTrack && (
                          <p className="text-sm text-red-500 mt-1">{errors.reasonIfNotOnTrack}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Timeline & Dates Section */}
            <Collapsible open={timelineDatesOpen} onOpenChange={setTimelineDatesOpen}>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-4 h-auto hover:bg-purple-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-purple-900">Timeline & Dates</div>
                        <div className="text-sm text-purple-700">Project timeline and key dates</div>
                      </div>
                    </div>
                    <div className="ml-auto">
                      {timelineDatesOpen ? (
                        <ChevronDown className="w-4 h-4 text-purple-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-purple-700" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-6 bg-white border-t border-purple-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate" className="text-sm font-medium">
                          Start Date {isFieldRequired("startDate") && <span className="text-red-500">*</span>}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !formData.startDate && "text-muted-foreground",
                                errors.startDate && "border-red-500",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.startDate ? (
                                format(new Date(formData.startDate + "T00:00:00"), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.startDate ? new Date(formData.startDate + "T00:00:00") : undefined}
                              onSelect={(date) => handleDateChange("startDate", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>}
                      </div>

                      <div>
                        <Label htmlFor="estimatedReleaseDate" className="text-sm font-medium">
                          Estimated Release Date{" "}
                          {isFieldRequired("estimatedReleaseDate") && <span className="text-red-500">*</span>}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !formData.estimatedReleaseDate && "text-muted-foreground",
                                errors.estimatedReleaseDate && "border-red-500",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.estimatedReleaseDate ? (
                                format(new Date(formData.estimatedReleaseDate + "T00:00:00"), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                formData.estimatedReleaseDate
                                  ? new Date(formData.estimatedReleaseDate + "T00:00:00")
                                  : undefined
                              }
                              onSelect={(date) => handleDateChange("estimatedReleaseDate", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.estimatedReleaseDate && (
                          <p className="text-sm text-red-500 mt-1">{errors.estimatedReleaseDate}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="actualReleaseDate" className="text-sm font-medium">
                          Actual Release Date{" "}
                          {isFieldRequired("actualReleaseDate") && <span className="text-red-500">*</span>}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !formData.actualReleaseDate && "text-muted-foreground",
                                errors.actualReleaseDate && "border-red-500",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.actualReleaseDate ? (
                                format(new Date(formData.actualReleaseDate + "T00:00:00"), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                formData.actualReleaseDate
                                  ? new Date(formData.actualReleaseDate + "T00:00:00")
                                  : undefined
                              }
                              onSelect={(date) => handleDateChange("actualReleaseDate", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.actualReleaseDate && (
                          <p className="text-sm text-red-500 mt-1">{errors.actualReleaseDate}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="estimatedGTMType" className="text-sm font-medium">
                          GTM Type {isFieldRequired("estimatedGtmType") && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={formData.estimatedGTMType}
                          onValueChange={(value) => handleInputChange("estimatedGTMType", value)}
                        >
                          <SelectTrigger className={cn("mt-1", errors.estimatedGtmType && "border-red-500")}>
                            <SelectValue placeholder="Select GTM type" />
                          </SelectTrigger>
                          <SelectContent>
                            {configItems?.gtmTypes?.map((gtmType) => (
                              <SelectItem key={gtmType.id} value={gtmType.label}>
                                {gtmType.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.estimatedGtmType && (
                          <p className="text-sm text-red-500 mt-1">{errors.estimatedGtmType}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Additional Details Section */}
            <Collapsible open={additionalDetailsOpen} onOpenChange={setAdditionalDetailsOpen}>
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-4 h-auto hover:bg-teal-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-teal-900">Additional Details</div>
                        <div className="text-sm text-teal-700">Tags and attachments</div>
                      </div>
                    </div>
                    <div className="ml-auto">
                      {additionalDetailsOpen ? (
                        <ChevronDown className="w-4 h-4 text-teal-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-teal-700" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-6 bg-white border-t border-teal-200 space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddTag()
                              }
                            }}
                            className="flex-1"
                          />
                          <Button type="button" onClick={handleAddTag} size="sm" disabled={!newTag.trim()}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                  onClick={() => handleRemoveTag(tag)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            {initiative ? "Update Initiative" : "Create Initiative"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
