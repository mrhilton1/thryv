import { createClient } from "@/lib/supabase/client"

export interface FieldMapping {
  id?: string
  fieldName: string
  sourceValue: string
  targetValue: string
  targetType: "existing" | "new" | "keep" | "skip"
  createdBy?: string
}

export interface UnmappedField {
  fieldName: string
  value: string
  availableOptions: string[]
  category: string
}

export interface FieldVerification {
  fieldName: string
  value: string
  availableOptions: string[]
  category: string
  isValid: boolean
  suggestedMapping?: string
}

class FieldMappingService {
  private supabase = createClient()
  private mappings: Map<string, string> = new Map()
  private validStatusValues: string[] = []

  async loadMappings() {
    try {
      const { data, error } = await this.supabase.from("field_mappings").select("*")

      if (error) {
        console.error("Error loading field mappings:", error)
        return
      }

      this.mappings.clear()
      data?.forEach((mapping) => {
        const key = `${mapping.field_name}:${mapping.source_value}`
        // Store mappings that change the value or skip it
        if (mapping.target_type === "existing" || mapping.target_type === "new") {
          this.mappings.set(key, mapping.target_value)
        } else if (mapping.target_type === "skip") {
          this.mappings.set(key, "__SKIP__")
        }
        // "keep" type mappings are not stored in cache (use original value)
      })

      console.log("🔥 Loaded field mappings:", Array.from(this.mappings.entries()))
    } catch (error) {
      console.error("Error loading field mappings:", error)
    }
  }

  // Load valid status values from the backend configuration
  async loadValidStatusValues() {
    try {
      const { data, error } = await this.supabase
        .from("config_items")
        .select("label")
        .eq("category", "statuses")
        .eq("is_active", true)

      if (error) {
        console.error("Error loading valid status values:", error)
        return
      }

      this.validStatusValues = data?.map((item) => item.label) || []
      console.log("🔥 Loaded valid status values from backend:", this.validStatusValues)
    } catch (error) {
      console.error("Error loading valid status values:", error)
    }
  }

  // Get available options for a specific field
  getAvailableOptionsForField(fieldName: string, config: any): string[] {
    console.log(`Getting available options for field: ${fieldName}`)
    console.log("Config object:", config)

    const fieldToConfigMap: Record<string, string> = {
      productArea: "productAreas",
      team: "teams",
      status: "statuses",
      priority: "priorities",
      businessImpact: "businessImpacts",
      processStage: "processStages",
      estimatedGtmType: "gtmTypes",
    }

    const configKey = fieldToConfigMap[fieldName]
    if (!configKey) {
      console.warn(`No config mapping found for field: ${fieldName}`)
      return []
    }

    let availableOptions: string[] = []

    // Try different ways to access the config data
    if (config && config[configKey]) {
      console.log(`Found config[${configKey}]:`, config[configKey])
      availableOptions = config[configKey]
        .map((item: any) => {
          return item.name || item.label || item.value || item.title || String(item)
        })
        .filter(Boolean)
    } else if (config && config.configItems && config.configItems[configKey]) {
      console.log(`Found config.configItems[${configKey}]:`, config.configItems[configKey])
      availableOptions = config.configItems[configKey]
        .map((item: any) => {
          return item.name || item.label || item.value || item.title || String(item)
        })
        .filter(Boolean)
    } else {
      console.log(`No config found for ${configKey}`)
      console.log("Available config keys:", Object.keys(config || {}))
      if (config && config.configItems) {
        console.log("Available configItems keys:", Object.keys(config.configItems || {}))
      }
    }

    console.log(`Available options for ${fieldName}:`, availableOptions)
    return availableOptions
  }

  async createConfigItem(category: string, name: string, createdBy?: string) {
    try {
      console.log(`🔥 Creating new config item: ${category} - ${name}`)

      // First check if the item already exists
      const { data: existingItem, error: checkError } = await this.supabase
        .from("config_items")
        .select("*")
        .eq("category", category)
        .eq("label", name)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected
        console.error("Error checking existing config item:", checkError)
        throw checkError
      }

      if (existingItem) {
        console.log(`✅ Config item already exists: ${category} - ${name}`)
        return existingItem
      }

      // Get the current max sort order for this category
      const { data: existingItems, error: fetchError } = await this.supabase
        .from("config_items")
        .select("sort_order")
        .eq("category", category)
        .order("sort_order", { ascending: false })
        .limit(1)

      if (fetchError) {
        console.error("Error fetching existing config items:", fetchError)
      }

      const nextSortOrder = existingItems && existingItems.length > 0 ? existingItems[0].sort_order + 1 : 1

      const insertData: any = {
        category: category,
        label: name,
        sort_order: nextSortOrder,
        is_active: true,
        color: "gray", // Default color
      }

      // Add created_by_id if we have a valid UUID
      if (createdBy && typeof createdBy === "string" && createdBy.length > 10) {
        insertData.created_by_id = createdBy
      }

      console.log("🔥 Attempting to insert config item with data:", insertData)

      const { data, error } = await this.supabase.from("config_items").insert(insertData).select().single()

      if (error) {
        console.error("❌ Error creating config item:", error)
        throw error
      }

      console.log("✅ Successfully created config item:", data)
      return data
    } catch (error) {
      console.error("❌ Error creating config item:", error)
      throw error
    }
  }

  async saveMappings(mappings: FieldMapping[]) {
    try {
      console.log("🔥 === SAVING FIELD MAPPINGS ===")
      console.log("🔥 Mappings to save:", mappings)

      // STEP 1: Create new config items for "new" type mappings FIRST
      const newConfigItems: any[] = []

      for (const mapping of mappings) {
        if (mapping.targetType === "new") {
          console.log(`🔥 Creating new config item for ${mapping.fieldName}: ${mapping.targetValue}`)

          // Map field names to config categories
          const categoryMap: Record<string, string> = {
            productArea: "product_areas",
            team: "teams",
            status: "statuses",
            priority: "priorities",
            businessImpact: "business_impacts",
            processStage: "process_stages",
            estimatedGtmType: "gtm_types",
            estimatedGTMType: "gtm_types", // Also handle uppercase version
          }

          const category = categoryMap[mapping.fieldName]
          if (category) {
            try {
              const newItem = await this.createConfigItem(category, mapping.targetValue, mapping.createdBy)
              newConfigItems.push(newItem)
              console.log(`✅ Created/found config item: ${category} - ${mapping.targetValue}`)
            } catch (error) {
              console.error(`❌ Failed to create config item: ${category} - ${mapping.targetValue}`, error)
              // Don't throw here - continue with other mappings
            }
          } else {
            console.warn(`❌ No category mapping found for field: ${mapping.fieldName}`)
          }
        }
      }

      // STEP 2: Wait a moment for database consistency
      if (newConfigItems.length > 0) {
        console.log(`🔥 Created/found ${newConfigItems.length} config items, waiting for database consistency...`)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // STEP 3: Save the field mappings
      const mappingInserts = mappings.map((mapping) => {
        const insertData: any = {
          field_name: mapping.fieldName,
          source_value: mapping.sourceValue,
          target_value: mapping.targetValue,
          target_type: mapping.targetType,
        }

        // Add created_by_id if we have a valid UUID
        if (mapping.createdBy && typeof mapping.createdBy === "string" && mapping.createdBy.length > 10) {
          insertData.created_by_id = mapping.createdBy
        }

        return insertData
      })

      console.log("🔥 Inserting field mappings:", mappingInserts)

      const { error } = await this.supabase
        .from("field_mappings")
        .upsert(mappingInserts, { onConflict: "field_name,source_value" })

      if (error) {
        console.error("❌ Error saving field mappings:", error)
        throw error
      }

      // STEP 4: Update local cache
      mappings.forEach((mapping) => {
        const key = `${mapping.fieldName}:${mapping.sourceValue}`
        if (mapping.targetType === "existing" || mapping.targetType === "new") {
          this.mappings.set(key, mapping.targetValue)
        } else if (mapping.targetType === "skip") {
          this.mappings.set(key, "__SKIP__")
        } else if (mapping.targetType === "keep") {
          // Remove from cache if it exists (user chose to keep original)
          this.mappings.delete(key)
        }
      })

      console.log("✅ All field mappings saved successfully")

      // STEP 5: Return the new config items so the caller can refresh data
      return newConfigItems
    } catch (error) {
      console.error("❌ Error saving field mappings:", error)
      throw error
    }
  }

  applyMappings(data: any): any {
    const mappedData = { ...data }

    console.log("🔥 === APPLYING FIELD MAPPINGS ===")
    console.log("🔥 Original data:", data)
    console.log("🔥 Current mappings cache:", Array.from(this.mappings.entries()))
    console.log("🔥 Valid status values:", this.validStatusValues)

    Object.keys(mappedData).forEach((fieldName) => {
      const value = mappedData[fieldName]
      if (typeof value === "string") {
        const key = `${fieldName}:${value}`
        const mappedValue = this.mappings.get(key)

        console.log(`🔥 Checking field "${fieldName}" with value "${value}"`)
        console.log(`🔥 Mapping key: "${key}"`)
        console.log(`🔥 Mapped value: "${mappedValue}"`)

        // AGGRESSIVE FIX: Never auto-map valid status values from backend config
        if (fieldName === "status" && this.validStatusValues.includes(value)) {
          console.log(`🚫 BLOCKING auto-mapping for valid status "${value}" - keeping original`)
          return // Skip this field entirely - keep original value
        }

        if (mappedValue === "__SKIP__") {
          // Remove the field entirely if it should be skipped
          console.log(`🔥 Skipping field "${fieldName}"`)
          delete mappedData[fieldName]
        } else if (mappedValue) {
          // Apply the mapping ONLY if it's not a valid status value
          console.log(`🔥 Mapping "${value}" to "${mappedValue}" for field "${fieldName}"`)
          mappedData[fieldName] = mappedValue
        } else {
          console.log(`🔥 No mapping found, keeping original value "${value}"`)
        }
        // If no mapping exists, keep the original value (this handles "keep" type)
      }
    })

    console.log("🔥 Final mapped data:", mappedData)
    console.log("🔥 === END APPLYING FIELD MAPPINGS ===")
    return mappedData
  }

  // Enhanced method to verify ALL fields for import, not just unmapped ones
  verifyAllFields(data: any, config: any): FieldVerification[] {
    const verifications: FieldVerification[] = []

    console.log("=== VERIFYING ALL FIELDS FOR IMPORT ===")
    console.log("Input data:", data)
    console.log("Config object:", config)

    // Define field mappings to config categories
    const fieldMappings = [
      {
        field: "productArea",
        category: "product_areas",
        configKey: "productAreas",
        label: "Product Area",
      },
      {
        field: "team",
        category: "teams",
        configKey: "teams",
        label: "Team",
      },
      {
        field: "status",
        category: "statuses",
        configKey: "statuses",
        label: "Status",
      },
      {
        field: "priority",
        category: "priorities",
        configKey: "priorities",
        label: "Priority",
      },
      {
        field: "businessImpact",
        category: "business_impacts",
        configKey: "businessImpacts",
        label: "Business Impact",
      },
      {
        field: "processStage",
        category: "process_stages",
        configKey: "processStages",
        label: "Process Stage",
      },
      {
        field: "estimatedGtmType",
        category: "gtm_types",
        configKey: "gtmTypes",
        label: "GTM Type",
      },
    ]

    fieldMappings.forEach(({ field, category, configKey, label }) => {
      const value = data[field]

      console.log(`\nVerifying field: ${field}`)
      console.log(`Value: "${value}"`)
      console.log(`Looking for config key: ${configKey}`)

      // Get available options from config using the new method
      const availableOptions = this.getAvailableOptionsForField(field, config)

      // ALWAYS add to verification list for important fields, even if empty
      const isImportantField = ["businessImpact", "estimatedGtmType"].includes(field)

      if ((value && typeof value === "string" && value.trim() !== "") || isImportantField) {
        // AGGRESSIVE FIX: For status field, check against valid status values from backend first
        let valueExists = false
        if (field === "status" && this.validStatusValues.includes(value)) {
          console.log(`✅ Status "${value}" is a valid status value from backend config`)
          valueExists = true
        } else {
          // Check if value exists (case insensitive)
          valueExists = value && availableOptions.some((option: string) => option.toLowerCase() === value.toLowerCase())
        }

        // Check if we have a stored mapping
        const mappingKey = `${field}:${value}`
        const hasMapping = this.mappings.has(mappingKey)

        // Find suggested mapping (closest match)
        let suggestedMapping = undefined
        if (!valueExists && !hasMapping && value) {
          suggestedMapping = availableOptions.find(
            (option) =>
              option.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(option.toLowerCase()),
          )
        }

        // For empty important fields, suggest the first available option
        if (!value && isImportantField && availableOptions.length > 0) {
          suggestedMapping = availableOptions[0]
        }

        console.log(`Value exists: ${valueExists}, Has mapping: ${hasMapping}, Suggested: ${suggestedMapping}`)

        verifications.push({
          fieldName: field,
          value: value || "",
          availableOptions: availableOptions,
          category: category,
          isValid: Boolean(valueExists || hasMapping),
          suggestedMapping: suggestedMapping,
        })
      }
    })

    console.log("=== FINAL FIELD VERIFICATIONS ===")
    console.log(verifications)

    return verifications
  }

  detectUnmappedFields(data: any, config: any): UnmappedField[] {
    const verifications = this.verifyAllFields(data, config)

    // Return only invalid fields as unmapped, but ALWAYS include important empty fields
    return verifications
      .filter((v) => {
        const isImportantField = ["businessImpact", "estimatedGtmType"].includes(v.fieldName)
        const isEmpty = !v.value || v.value.trim() === ""
        const isInvalid = !v.isValid

        // Include if invalid OR if it's an important field that's empty
        return isInvalid || (isImportantField && isEmpty)
      })
      .map((v) => ({
        fieldName: v.fieldName,
        value: v.value,
        availableOptions: v.availableOptions,
        category: v.category,
      }))
  }

  async getAllMappings() {
    try {
      const { data, error } = await this.supabase
        .from("field_mappings")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching field mappings:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching field mappings:", error)
      return []
    }
  }

  async deleteMapping(id: string) {
    try {
      const { error } = await this.supabase.from("field_mappings").delete().eq("id", id)

      if (error) {
        console.error("Error deleting field mapping:", error)
        throw error
      }

      // Reload mappings to update cache
      await this.loadMappings()
    } catch (error) {
      console.error("Error deleting field mapping:", error)
      throw error
    }
  }

  // Method to clear any problematic status mappings
  async clearStatusMappings() {
    try {
      console.log("🔥 Clearing all status field mappings...")

      const { error } = await this.supabase.from("field_mappings").delete().eq("field_name", "status")

      if (error) {
        console.error("Error clearing status mappings:", error)
        throw error
      }

      // Reload mappings to update cache
      await this.loadMappings()
      console.log("✅ Status mappings cleared successfully")
    } catch (error) {
      console.error("Error clearing status mappings:", error)
      throw error
    }
  }

  // Enhanced method to get all field values that will be imported
  getImportPreview(data: any): Record<string, { originalValue: string; mappedValue: string; action: string }> {
    const preview: Record<string, { originalValue: string; mappedValue: string; action: string }> = {}

    const fieldMappings = [
      "productArea",
      "team",
      "status",
      "priority",
      "businessImpact",
      "processStage",
      "estimatedGtmType",
    ]

    fieldMappings.forEach((fieldName) => {
      const value = data[fieldName]
      if (value !== undefined && value !== null) {
        const stringValue = String(value).trim()
        const key = `${fieldName}:${stringValue}`
        const mappedValue = this.mappings.get(key)

        // AGGRESSIVE FIX: Never show mapping for valid status values from backend
        if (fieldName === "status" && this.validStatusValues.includes(stringValue)) {
          preview[fieldName] = {
            originalValue: stringValue,
            mappedValue: stringValue,
            action: "keep",
          }
          return
        }

        if (mappedValue === "__SKIP__") {
          preview[fieldName] = {
            originalValue: stringValue,
            mappedValue: "(skipped)",
            action: "skip",
          }
        } else if (mappedValue) {
          preview[fieldName] = {
            originalValue: stringValue,
            mappedValue: mappedValue,
            action: "mapped",
          }
        } else {
          preview[fieldName] = {
            originalValue: stringValue,
            mappedValue: stringValue,
            action: "keep",
          }
        }
      } else {
        // Handle empty/null values
        preview[fieldName] = {
          originalValue: "(empty)",
          mappedValue: "(empty)",
          action: "empty",
        }
      }
    })

    return preview
  }

  // Method to apply stored mappings to data
  async applyStoredMappings(data: any): Promise<any> {
    await this.loadMappings()
    await this.loadValidStatusValues() // Load valid status values from backend
    return this.applyMappings(data)
  }

  // Initialize the service by loading mappings and valid status values
  async initialize() {
    await this.loadMappings()
    await this.loadValidStatusValues()
  }
}

export const fieldMappingService = new FieldMappingService()
