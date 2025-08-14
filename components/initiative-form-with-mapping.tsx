"use client"

import { useState, useEffect } from "react"
import { useSupabaseDatabase } from "@/contexts/api-database-context"
import { useAdmin } from "@/contexts/admin-context"
import { InitiativeForm } from "@/components/initiative-form"
import { FieldMappingDialog } from "@/components/field-mapping-dialog"
import { fieldMappingService } from "@/lib/field-mapping-service"
import type { FieldMapping, FieldVerification } from "@/lib/field-mapping-service"

interface InitiativeFormWithMappingProps {
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function InitiativeFormWithMapping({ initialData, onSuccess, onCancel }: InitiativeFormWithMappingProps) {
  const { createInitiative, loadData } = useSupabaseDatabase()
  const { config, refreshConfig } = useAdmin()
  const [showMappingDialog, setShowMappingDialog] = useState(false)
  const [unmappedFields, setUnmappedFields] = useState<any[]>([])
  const [allFieldVerifications, setAllFieldVerifications] = useState<FieldVerification[]>([])
  const [processedData, setProcessedData] = useState<any>(null)
  const [sessionMappings, setSessionMappings] = useState<FieldMapping[]>([])

  // Load existing mappings when component mounts
  useEffect(() => {
    const loadMappings = async () => {
      try {
        await fieldMappingService.loadMappings()
      } catch (error) {
        console.error("Error loading field mappings:", error)
      }
    }
    loadMappings()
  }, [])

  const handleSubmit = async (data: any) => {
    console.log("🔥 === INITIATIVE FORM SUBMIT ===")
    console.log("🔥 Raw form data:", data)

    try {
      // STEP 1: Verify all fields and detect unmapped ones
      console.log("🔥 STEP 1: Verifying fields...")
      const allVerifications = fieldMappingService.verifyAllFields(data, config)
      const unmapped = fieldMappingService.detectUnmappedFields(data, config)

      console.log("🔥 All field verifications:", allVerifications)
      console.log("🔥 Unmapped fields:", unmapped)

      // STEP 2: If there are unmapped fields, show mapping dialog
      if (unmapped.length > 0) {
        console.log("🔥 STEP 2: Found unmapped fields, showing dialog...")
        setAllFieldVerifications(allVerifications)
        setUnmappedFields(unmapped)
        setProcessedData(data)
        setShowMappingDialog(true)
        return // Don't proceed with creation yet
      }

      // STEP 3: No unmapped fields, apply stored mappings and create initiative
      console.log("🔥 STEP 3: No unmapped fields, applying stored mappings...")
      const mappedData = await fieldMappingService.applyStoredMappings(data)
      console.log("🔥 Final mapped data:", mappedData)

      await createInitiative(mappedData)
      console.log("✅ Initiative created successfully")

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error)
      throw error
    }
  }

  const handleMappingsComplete = async (mappings: FieldMapping[]) => {
    console.log("🔥 === HANDLING MAPPINGS COMPLETE ===")
    console.log("🔥 Completed mappings:", mappings)

    try {
      // STEP 1: Save mappings (this will create new config items)
      console.log("🔥 STEP 1: Saving mappings...")
      const newConfigItems = await fieldMappingService.saveMappings(mappings)
      console.log("🔥 New config items created:", newConfigItems)

      // STEP 2: Refresh database context if new items were created
      if (newConfigItems && newConfigItems.length > 0) {
        console.log("🔥 STEP 2: Refreshing database context...")
        await loadData() // Refreshes configItems in context
        console.log("✅ Database context refreshed")

        // Also refresh admin config
        console.log("🔄 Refreshing admin config...")
        await refreshConfig()
        console.log("✅ Admin config refreshed")
      }

      // STEP 3: Store session mappings for final data processing
      setSessionMappings(mappings)

      // STEP 4: Apply session mappings to final data
      const finalData = { ...processedData }
      console.log("🔥 STEP 4: Applying session mappings to final data...")
      console.log("🔥 Original data:", finalData)

      // Apply each mapping to the final data
      mappings.forEach((mapping) => {
        if (mapping.targetType === "existing" || mapping.targetType === "new") {
          console.log(`🔥 Applying mapping: ${mapping.fieldName} = "${mapping.targetValue}"`)
          finalData[mapping.fieldName] = mapping.targetValue
        } else if (mapping.targetType === "skip") {
          console.log(`🔥 Skipping field: ${mapping.fieldName}`)
          delete finalData[mapping.fieldName]
        }
        // "keep" type mappings don't change the data
      })

      console.log("🔥 Final data after session mappings:", finalData)

      // STEP 5: Create the initiative
      console.log("🔥 STEP 5: Creating initiative...")
      await createInitiative(finalData)
      console.log("✅ Initiative created successfully with mappings")

      // STEP 6: Close dialog and call success callback
      setShowMappingDialog(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("❌ Error completing mappings:", error)
      throw error
    }
  }

  return (
    <>
      <InitiativeForm initialData={initialData} onSubmit={handleSubmit} onCancel={onCancel} />

      <FieldMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        unmappedFields={unmappedFields}
        onMappingsComplete={handleMappingsComplete}
        importData={processedData}
        allFieldVerifications={allFieldVerifications}
      />
    </>
  )
}
