"use client"

import { useState, useEffect } from "react"
import { useAdmin } from "@/contexts/admin-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Edit, Save, X, Info, Loader2 } from "lucide-react"
import type { UnmappedField, FieldMapping, FieldVerification } from "@/lib/field-mapping-service"

interface FieldMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unmappedFields: UnmappedField[]
  onMappingsComplete: (mappings: FieldMapping[]) => Promise<void>
  importData: any
  allFieldVerifications: FieldVerification[]
}

export function FieldMappingDialog({
  open,
  onOpenChange,
  unmappedFields,
  onMappingsComplete,
  importData,
  allFieldVerifications,
}: FieldMappingDialogProps) {
  const { config, refreshConfig } = useAdmin()
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [verifications, setVerifications] = useState<FieldVerification[]>([])
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [localAvailableOptions, setLocalAvailableOptions] = useState<Record<string, string[]>>({})

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      console.log("🔥 === INITIALIZING FIELD MAPPING DIALOG ===")
      console.log("🔥 All field verifications:", allFieldVerifications)
      console.log("🔥 Unmapped fields:", unmappedFields)

      // Set verifications from props - ensure we have data
      if (allFieldVerifications && allFieldVerifications.length > 0) {
        setVerifications([...allFieldVerifications])
        console.log("✅ Set verifications:", allFieldVerifications.length)
      } else {
        console.log("❌ No field verifications provided")
        setVerifications([])
      }

      // Initialize mappings from unmapped fields
      if (unmappedFields && unmappedFields.length > 0) {
        const initialMappings = unmappedFields.map((field) => ({
          fieldName: field.fieldName,
          sourceValue: field.value,
          targetValue: field.value,
          targetType: "skip" as const,
          category: field.category,
        }))
        setMappings(initialMappings)
        console.log("✅ Set mappings:", initialMappings.length)
      } else {
        console.log("❌ No unmapped fields provided")
        setMappings([])
      }

      // Initialize local available options from current config
      const initialOptions: Record<string, string[]> = {}
      allFieldVerifications.forEach((verification) => {
        initialOptions[verification.fieldName] = [...verification.availableOptions]
      })
      setLocalAvailableOptions(initialOptions)
      console.log("✅ Set local available options:", initialOptions)
    } else {
      // Reset state when dialog closes
      setVerifications([])
      setMappings([])
      setEditingField(null)
      setEditValue("")
      setIsSaving(false)
      setLocalAvailableOptions({})
    }
  }, [open, allFieldVerifications, unmappedFields, importData])

  const handleEditField = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName)
    setEditValue(currentValue)
  }

  const handleSaveEdit = async (fieldName: string) => {
    if (!editValue.trim()) return

    const trimmedValue = editValue.trim()
    console.log(`🔥 === SAVING EDIT FOR ${fieldName}: "${trimmedValue}" ===`)

    setIsSaving(true)

    try {
      // Get current available options for this field
      const currentOptions = localAvailableOptions[fieldName] || []
      console.log(`🔥 Current options for ${fieldName}:`, currentOptions)

      // Check if this is a new value (case insensitive)
      const isNewValue = !currentOptions.some((option) => option.toLowerCase() === trimmedValue.toLowerCase())
      console.log(`🔥 Is new value: ${isNewValue}`)

      // If it's a new value, we'll mark it as "new" but don't create it yet
      // The actual creation happens in the saveMappings function
      if (isNewValue) {
        console.log("🔥 Will create new config item when mappings are saved")

        // IMMEDIATELY add to local available options for UI feedback
        setLocalAvailableOptions((prev) => ({
          ...prev,
          [fieldName]: [...(prev[fieldName] || []), trimmedValue],
        }))
        console.log(`✅ Added "${trimmedValue}" to local options for ${fieldName}`)
      }

      // Update the verification state
      setVerifications((prev) =>
        prev.map((v) =>
          v.fieldName === fieldName
            ? {
                ...v,
                value: trimmedValue,
                isValid: true, // Mark as valid since user is explicitly setting it
                availableOptions: localAvailableOptions[fieldName] || v.availableOptions,
              }
            : v,
        ),
      )

      // Update or create mapping
      const existingMapping = mappings.find((m) => m.fieldName === fieldName)
      if (existingMapping) {
        setMappings((prev) =>
          prev.map((mapping) =>
            mapping.fieldName === fieldName
              ? {
                  ...mapping,
                  targetValue: trimmedValue,
                  targetType: isNewValue ? "new" : "existing",
                }
              : mapping,
          ),
        )
      } else {
        setMappings((prev) => [
          ...prev,
          {
            fieldName: fieldName,
            sourceValue: verifications.find((v) => v.fieldName === fieldName)?.value || "",
            targetValue: trimmedValue,
            targetType: isNewValue ? "new" : "existing",
            category: unmappedFields.find((u) => u.fieldName === fieldName)?.category || "",
          },
        ])
      }

      setEditingField(null)
      setEditValue("")

      console.log("✅ Field edit saved successfully")
    } catch (error) {
      console.error("❌ Error saving field edit:", error)
      alert(`Error saving field: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue("")
  }

  const handleComplete = async () => {
    try {
      await onMappingsComplete(mappings)
    } catch (error) {
      console.error("Error completing field mappings:", error)
    }
  }

  const getFieldDisplayName = (fieldName: string) => {
    const displayNames: Record<string, string> = {
      businessImpact: "Business Impact",
      estimatedGtmType: "GTM Type",
      processStage: "Process Stage",
      priority: "Priority",
      status: "Status",
      tier: "Tier",
      productArea: "Product Area",
      team: "Team",
    }
    return displayNames[fieldName] || fieldName
  }

  // Get available options for a field (use local first, then fallback to verification)
  const getAvailableOptionsForField = (fieldName: string) => {
    return (
      localAvailableOptions[fieldName] || verifications.find((v) => v.fieldName === fieldName)?.availableOptions || []
    )
  }

  // Calculate current state
  const validVerifications = verifications.filter((v) => v.isValid)
  const invalidVerifications = verifications.filter((v) => !v.isValid)
  const issueCount = invalidVerifications.length
  const validCount = validVerifications.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] p-0 flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="px-8 py-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Verify Field Mappings</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and validate {verifications.length} fields before importing
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden px-8 py-6">
          <div className="h-full flex flex-col space-y-6">
            {/* Summary Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-medium">Review all field values before importing.</p>
                  <p className="text-sm">Click the edit button to modify any field, even valid ones.</p>
                  <div className="flex items-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{validCount} Valid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">{issueCount} Issues</span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Field Verifications */}
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {verifications.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No field verifications available</p>
                    </div>
                  </div>
                ) : (
                  verifications.map((verification, index) => (
                    <Card
                      key={`${verification.fieldName}-${index}`}
                      className={`relative transition-all duration-200 ${
                        verification.isValid ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                verification.isValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{getFieldDisplayName(verification.fieldName)}</h4>
                              <p className="text-muted-foreground mt-1">{verification.value || "(empty)"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={verification.isValid ? "default" : "destructive"} className="px-3 py-1">
                              {verification.isValid ? "Valid" : "Invalid"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditField(verification.fieldName, verification.value)}
                              className="px-4"
                              disabled={editingField === verification.fieldName && isSaving}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>

                        {/* Edit Interface */}
                        {editingField === verification.fieldName && (
                          <div className="mt-6 p-6 bg-white rounded-lg border-2 border-blue-200">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-value" className="text-base font-medium">
                                  Edit Value
                                </Label>
                                <Input
                                  id="edit-value"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder="Enter new value or select from options below"
                                  className="mt-2 text-base"
                                  disabled={isSaving}
                                />
                              </div>

                              {/* Show create new indicator */}
                              {editValue &&
                                editValue.trim() !== "" &&
                                (() => {
                                  const availableOptions = getAvailableOptionsForField(verification.fieldName)
                                  const exists = availableOptions.some(
                                    (option) => option.toLowerCase() === editValue.toLowerCase(),
                                  )

                                  if (!exists && availableOptions.length > 0) {
                                    return (
                                      <Alert className="border-blue-200 bg-blue-50">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800">
                                          <p className="font-medium">Will create new option: "{editValue}"</p>
                                          <p className="text-sm">
                                            This value will be added to the{" "}
                                            {getFieldDisplayName(verification.fieldName)} field's available options.
                                          </p>
                                        </AlertDescription>
                                      </Alert>
                                    )
                                  }
                                  return null
                                })()}

                              <div className="flex items-center gap-3">
                                <Button onClick={() => handleSaveEdit(verification.fieldName)} disabled={isSaving}>
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                                  Cancel
                                </Button>
                              </div>

                              {/* Available Options - USE LOCAL OPTIONS */}
                              {(() => {
                                const availableOptions = getAvailableOptionsForField(verification.fieldName)
                                if (availableOptions.length > 0) {
                                  return (
                                    <div>
                                      <Label className="text-base font-medium">Available Options:</Label>
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        {availableOptions.map((option) => (
                                          <Button
                                            key={option}
                                            variant="outline"
                                            size="sm"
                                            className={`h-9 px-4 ${
                                              editValue.toLowerCase() === option.toLowerCase()
                                                ? "bg-blue-100 border-blue-300 text-blue-800"
                                                : ""
                                            }`}
                                            onClick={() => setEditValue(option)}
                                            disabled={isSaving}
                                          >
                                            {option}
                                          </Button>
                                        ))}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-3">
                                        💡 Tip: You can also type a custom value to create a new option
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              })()}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t bg-gray-50 px-8 py-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="font-medium">{verifications.length} fields verified</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{validCount} valid</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>{issueCount} issues</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={issueCount > 0}
                className={`px-6 ${issueCount > 0 ? "opacity-50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
              >
                {issueCount > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Fix {issueCount} Issue{issueCount !== 1 ? "s" : ""} First
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Initiative Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
