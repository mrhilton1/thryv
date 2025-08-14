import { createClient } from "./client"
import type { User, Initiative, Achievement, ConfigItem, NavigationConfig } from "@/lib/database/schemas"
import type { InitiativeWithRelations } from "@/types"

export class SupabaseDatabaseService {
  private supabase = createClient()

  // User methods
  async getUsers(): Promise<User[]> {
    console.log("=== DatabaseService.getUsers START ===")
    try {
      const { data, error } = await this.supabase.from("profiles").select("*").order("name")

      if (error) {
        console.error("Error fetching users:", error)
        throw error
      }

      const users = (data || []).map((user) => this.toCamelCase(user))
      console.log("Fetched users:", users.length)
      return users
    } catch (error) {
      console.error("Error in getUsers:", error)
      throw error
    }
  }

  async updateUser(id: string, data: any): Promise<User> {
    const { data: result, error } = await this.supabase
      .from("profiles")
      .update(this.toSnakeCase(data))
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async createUser(data: any): Promise<User> {
    const { data: result, error } = await this.supabase
      .from("profiles")
      .insert([this.toSnakeCase(data)])
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async deleteUser(id: string): Promise<void> {
    const { data: ownedInitiatives, error: ownedError } = await this.supabase
      .from("initiatives")
      .select("id, title")
      .eq("owner_id", id)

    if (ownedError) throw ownedError

    const { data: createdInitiatives, error: createdError } = await this.supabase
      .from("initiatives")
      .select("id, title")
      .eq("created_by_id", id)

    if (createdError) throw createdError

    const allInitiatives = [
      ...(ownedInitiatives || []),
      ...(createdInitiatives || []).filter(
        (created) => !(ownedInitiatives || []).some((owned) => owned.id === created.id),
      ),
    ]

    if (allInitiatives.length > 0) {
      const ownedCount = ownedInitiatives?.length || 0
      const createdCount = createdInitiatives?.length || 0
      let message = `Cannot delete user. They have ${allInitiatives.length} initiative(s) associated: ${allInitiatives.map((i) => i.title).join(", ")}.`

      if (ownedCount > 0 && createdCount > 0) {
        message += ` (${ownedCount} owned, ${createdCount} created)`
      } else if (ownedCount > 0) {
        message += ` (owned)`
      } else {
        message += ` (created)`
      }

      message += ` Please reassign these initiatives first.`
      throw new Error(message)
    }

    const { error } = await this.supabase.from("profiles").delete().eq("id", id)
    if (error) throw error
  }

  // Navigation methods
  async getNavigationConfig(): Promise<NavigationConfig[]> {
    console.log("=== DatabaseService.getNavigationConfig START ===")
    try {
      const { data, error } = await this.supabase.from("navigation_settings").select("*").order("sort_order")

      if (error) {
        console.error("Error fetching navigation config:", error)
        throw error
      }

      const config = (data || []).map((config) => this.toCamelCase(config))
      console.log("Fetched navigation config:", config.length)
      return config
    } catch (error) {
      console.error("Error in getNavigationConfig:", error)
      throw error
    }
  }

  async createNavigationConfig(data: any): Promise<NavigationConfig> {
    const { data: result, error } = await this.supabase
      .from("navigation_settings")
      .insert([this.toSnakeCase(data)])
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async updateNavigationConfig(id: string, data: any): Promise<NavigationConfig> {
    const { data: result, error } = await this.supabase
      .from("navigation_settings")
      .update(this.toSnakeCase(data))
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async deleteNavigationConfig(id: string): Promise<void> {
    const { error } = await this.supabase.from("navigation_settings").delete().eq("id", id)
    if (error) throw error
  }

  async reorderNavigationConfig(items: { id: string; sortOrder: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await this.supabase
        .from("navigation_settings")
        .update({ sort_order: item.sortOrder })
        .eq("id", item.id)

      if (error) throw error
    }
  }

  // Initiative methods
  async getInitiatives(): Promise<InitiativeWithRelations[]> {
    console.log("=== DatabaseService.getInitiatives START ===")
    try {
      const { data, error } = await this.supabase
        .from("initiatives")
        .select(`
          *,
          owner:profiles!owner_id (
            id,
            name,
            email,
            avatar
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching initiatives:", error)
        throw error
      }

      const initiatives = (data || []).map((initiative) => this.toCamelCase(initiative))
      console.log("Fetched initiatives:", initiatives.length)
      return initiatives
    } catch (error) {
      console.error("Error in getInitiatives:", error)
      throw error
    }
  }

  async getInitiativesByOwner(ownerId: string): Promise<Initiative[]> {
    const { data, error } = await this.supabase
      .from("initiatives")
      .select("id, title, description")
      .eq("owner_id", ownerId)

    if (error) throw error
    return (data || []).map((initiative) => this.toCamelCase(initiative))
  }

  async getInitiativesByCreator(creatorId: string): Promise<Initiative[]> {
    const { data, error } = await this.supabase
      .from("initiatives")
      .select("id, title, description")
      .eq("created_by_id", creatorId)

    if (error) throw error
    return (data || []).map((initiative) => this.toCamelCase(initiative))
  }

  async createInitiative(data: any): Promise<Initiative> {
    console.log("=== DatabaseService.createInitiative START ===")
    console.log("Creating initiative with data:", data)

    try {
      // Validate required fields
      if (!data.title?.trim()) {
        throw new Error("Initiative title is required")
      }

      // Get fallback user ID if needed
      let ownerId = data.ownerId || data.owner_id
      let createdById = data.createdById || data.created_by_id || data.lastUpdatedById

      if (!ownerId || !createdById) {
        console.log("Missing required user IDs, getting first available user...")
        const { data: users, error: usersError } = await this.supabase.from("profiles").select("id").limit(1)

        if (usersError) {
          console.error("Error fetching users for fallback:", usersError)
          throw new Error("Missing required user IDs and unable to find fallback user")
        }

        if (!users || users.length === 0) {
          console.log("No users found, creating default user...")
          const { data: newUser, error: createError } = await this.supabase
            .from("profiles")
            .insert({
              name: "Default User",
              email: "default@example.com",
              role: "admin",
            })
            .select("id")
            .single()

          if (createError) {
            console.error("Error creating default user:", createError)
            throw new Error("Failed to create default user")
          }

          const fallbackUserId = newUser.id
          console.log("Created default user with ID:", fallbackUserId)
          if (!ownerId) ownerId = fallbackUserId
          if (!createdById) createdById = fallbackUserId
        } else {
          const fallbackUserId = users[0].id
          console.log("Using existing user ID:", fallbackUserId)
          if (!ownerId) ownerId = fallbackUserId
          if (!createdById) createdById = fallbackUserId
        }
      }

      // Validate and set status
      const validStatuses = [
        "On Track",
        "At Risk",
        "Off Track",
        "Complete",
        "Cancelled",
        "Paused",
        "Blocked",
        "Deprioritized",
      ]

      const status = data.status || "On Track"
      if (!validStatuses.includes(status)) {
        console.warn(`Invalid status "${status}", defaulting to "On Track"`)
        data.status = "On Track"
      }

      // Validate and set priority
      const validPriorities = ["Low", "Medium", "High", "Critical"]
      const priority = data.priority || "Medium"
      if (!validPriorities.includes(priority)) {
        console.warn(`Invalid priority "${priority}", defaulting to "Medium"`)
        data.priority = "Medium"
      }

      // Prepare data for insertion
      const insertData = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        goal: data.goal?.trim() || null,
        product_area: data.productArea?.trim() || "General",
        owner_id: ownerId,
        created_by_id: createdById,
        team: data.team?.trim() || "Unassigned",
        tier: Number(data.tier) || 1,
        status: status,
        process_stage: data.processStage?.trim() || "Planning",
        priority: priority,
        business_impact: data.businessImpact?.trim() || "Increase Revenue",
        start_date: data.startDate || new Date().toISOString().split("T")[0],
        estimated_release_date: data.estimatedReleaseDate || null,
        actual_release_date: data.actualReleaseDate || null,
        estimated_gtm_type: data.estimatedGtmType || null,
        progress: Number(data.progress) || 0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        executive_update: data.executiveUpdate?.trim() || null,
        reason_if_not_on_track: data.reasonIfNotOnTrack?.trim() || null,
        show_on_executive_summary: Boolean(data.showOnExecutiveSummary),
        last_updated_by_id: createdById,
      }

      console.log("Final data for database insertion:", insertData)

      const { data: result, error } = await this.supabase
        .from("initiatives")
        .insert([insertData])
        .select(`
          *,
          owner:profiles!owner_id (
            id,
            name,
            email,
            avatar
          )
        `)
        .single()

      if (error) {
        console.error("Database error creating initiative:", error)
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        // Provide specific error messages
        if (error.code === "23514" && error.message.includes("status")) {
          throw new Error(
            `Status constraint violation: "${status}" is not allowed. Please run the database migration script to update the status constraint. Valid values are: ${validStatuses.join(", ")}`,
          )
        }

        if (error.code === "23502") {
          const match = error.message.match(/column "([^"]+)"/)
          const columnName = match ? match[1] : "unknown"
          throw new Error(`Required field "${columnName}" is missing`)
        }

        throw error
      }

      console.log("Successfully created initiative:", result)
      console.log("=== DatabaseService.createInitiative END ===")
      return this.toCamelCase(result)
    } catch (error) {
      console.error("Error in createInitiative:", error)
      throw error
    }
  }

  async updateInitiative(id: string, data: any): Promise<Initiative> {
    const { data: result, error } = await this.supabase
      .from("initiatives")
      .update(this.toSnakeCase(data))
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async deleteInitiative(id: string): Promise<void> {
    const { error } = await this.supabase.from("initiatives").delete().eq("id", id)
    if (error) throw error
  }

  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    console.log("=== DatabaseService.getAchievements START ===")
    try {
      const { data, error } = await this.supabase
        .from("achievements")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching achievements:", error)
        throw error
      }

      const achievements = (data || []).map((achievement) => this.toCamelCase(achievement))
      console.log("Fetched achievements:", achievements.length)
      return achievements
    } catch (error) {
      console.error("Error in getAchievements:", error)
      throw error
    }
  }

  async createAchievement(data: any): Promise<Achievement> {
    console.log("🔍 SupabaseDatabaseService.createAchievement called with data:", data)

    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuid && uuidRegex.test(uuid)
    }

    const createdById = data.createdById || data.created_by_id
    const initiativeId = data.initiativeId || data.initiative_id

    const mappedData = {
      title: data.title,
      description: data.description,
      type: data.type,
      icon: data.icon,
      date_achieved: data.dateAchieved || data.date_achieved || new Date().toISOString().split("T")[0],
      created_by_id: isValidUUID(createdById) ? createdById : null,
      initiative_id: isValidUUID(initiativeId) ? initiativeId : null,
    }

    console.log("🔍 Mapped data for Supabase:", mappedData)

    const { data: result, error } = await this.supabase.from("achievements").insert([mappedData]).select().single()

    console.log("🔍 Supabase response - result:", result)
    console.log("🔍 Supabase response - error:", error)

    if (error) {
      console.error("❌ Supabase createAchievement error:", error)
      throw error
    }

    const camelCaseResult = this.toCamelCase(result)
    console.log("🔍 Final camelCase result:", camelCaseResult)
    return camelCaseResult
  }

  async updateAchievement(id: string, data: any): Promise<Achievement> {
    console.log("🔍 SupabaseDatabaseService.updateAchievement called with data:", data)

    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuid && uuidRegex.test(uuid)
    }

    const createdById = data.createdById || data.created_by_id
    const initiativeId = data.initiativeId || data.initiative_id

    const mappedData = {
      title: data.title,
      description: data.description,
      type: data.type,
      icon: data.icon,
      date_achieved: data.dateAchieved || data.date_achieved,
      created_by_id: isValidUUID(createdById) ? createdById : null,
      initiative_id: isValidUUID(initiativeId) ? initiativeId : null,
    }

    console.log("🔍 Mapped update data for Supabase:", mappedData)

    const { data: result, error } = await this.supabase
      .from("achievements")
      .update(mappedData)
      .eq("id", id)
      .select()
      .single()

    console.log("🔍 Supabase update response - result:", result)
    console.log("🔍 Supabase update response - error:", error)

    if (error) {
      console.error("❌ Supabase updateAchievement error:", error)
      throw error
    }

    const camelCaseResult = this.toCamelCase(result)
    console.log("🔍 Final update camelCase result:", camelCaseResult)
    return camelCaseResult
  }

  async deleteAchievement(id: string): Promise<void> {
    const { error } = await this.supabase.from("achievements").delete().eq("id", id)
    if (error) throw error
  }

  // Config item methods
  async getConfigItems(): Promise<ConfigItem[]> {
    console.log("=== DatabaseService.getConfigItems START ===")
    try {
      const { data, error } = await this.supabase.from("config_items").select("*").order("sort_order")

      if (error) {
        console.error("Error fetching config items:", error)
        throw error
      }

      const items = (data || []).map((item) => this.toCamelCase(item))
      console.log("Fetched config items:", items.length)
      return items
    } catch (error) {
      console.error("Error in getConfigItems:", error)
      throw error
    }
  }

  async getAllConfigItems(): Promise<ConfigItem[]> {
    return this.getConfigItems()
  }

  async createConfigItem(data: any): Promise<ConfigItem> {
    const { data: result, error } = await this.supabase
      .from("config_items")
      .insert([this.toSnakeCase(data)])
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async updateConfigItem(id: string, data: any): Promise<ConfigItem> {
    const { data: result, error } = await this.supabase
      .from("config_items")
      .update(this.toSnakeCase(data))
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async deleteConfigItem(id: string): Promise<void> {
    const { error } = await this.supabase.from("config_items").delete().eq("id", id)
    if (error) throw error
  }

  async reorderConfigItems(category: string, items: { id: string; sortOrder: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await this.supabase
        .from("config_items")
        .update({ sort_order: item.sortOrder })
        .eq("id", item.id)

      if (error) throw error
    }
  }

  // Field configuration methods
  async getFieldConfigurations(): Promise<any[]> {
    console.log("=== DatabaseService.getFieldConfigurations START ===")
    try {
      const { data, error } = await this.supabase.from("field_configurations").select("*").order("created_at")

      if (error) {
        console.error("Error fetching field configurations:", error)
        throw error
      }

      const configs = (data || []).map((item) => this.toCamelCase(item))
      console.log("Fetched field configurations:", configs.length)
      return configs
    } catch (error) {
      console.error("Error in getFieldConfigurations:", error)
      throw error
    }
  }

  async updateFieldConfiguration(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from("field_configurations")
      .update(this.toSnakeCase(data))
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async reorderFieldConfigurations(items: { id: string; order: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await this.supabase.from("field_configurations").update({ order: item.order }).eq("id", item.id)
      if (error) throw error
    }
  }

  // Field mapping methods
  async getFieldMappings(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("field_mappings")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data || []).map((mapping) => this.toCamelCase(mapping))
  }

  async createFieldMapping(data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from("field_mappings")
      .insert([this.toSnakeCase(data)])
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async updateFieldMapping(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from("field_mappings")
      .update(this.toSnakeCase(data))
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
  }

  async deleteFieldMapping(id: string): Promise<void> {
    const { error } = await this.supabase.from("field_mappings").delete().eq("id", id)
    if (error) throw error
  }

  async upsertFieldMappings(mappings: any[]): Promise<any[]> {
    const mappingData = mappings.map((mapping) => this.toSnakeCase(mapping))

    const { data, error } = await this.supabase
      .from("field_mappings")
      .upsert(mappingData, {
        onConflict: "field_name,source_value",
        ignoreDuplicates: false,
      })
      .select()

    if (error) throw error
    return (data || []).map((item) => this.toCamelCase(item))
  }

  // Utility methods
  async transferInitiativeRelationships(fromUserId: string, toUserId: string): Promise<void> {
    // Transfer ownership
    const { error: ownerError } = await this.supabase
      .from("initiatives")
      .update({ owner_id: toUserId })
      .eq("owner_id", fromUserId)

    if (ownerError) throw ownerError

    // Transfer creation relationship
    const { error: creatorError } = await this.supabase
      .from("initiatives")
      .update({ created_by_id: toUserId })
      .eq("created_by_id", fromUserId)

    if (creatorError) throw creatorError
  }

  // Helper methods for case conversion
  private toCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== "object") return obj
    if (Array.isArray(obj)) return obj.map((item) => this.toCamelCase(item))

    const camelObj: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      if (value === null || value === undefined || value === "undefined") {
        camelObj[camelKey] = null
      } else {
        camelObj[camelKey] = this.toCamelCase(value)
      }
    }
    return camelObj
  }

  private toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== "object") return obj
    if (Array.isArray(obj)) return obj.map((item) => this.toSnakeCase(item))

    const snakeObj: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      snakeObj[snakeKey] = this.toSnakeCase(value)
    }
    return snakeObj
  }
}

export const databaseService = new SupabaseDatabaseService()
