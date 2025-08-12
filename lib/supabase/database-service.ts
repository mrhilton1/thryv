import { createClient } from "./client"
import type { User, Initiative, Achievement, ConfigItem, NavigationConfig } from "@/lib/database/schemas"
import type { InitiativeWithRelations } from "@/types"

export class SupabaseDatabaseService {
  private supabase = createClient()

  // Updated to use profiles table instead of users
  async getUsers(): Promise<User[]> {
    const { data, error } = await this.supabase.from("profiles").select("*").order("name")

    if (error) throw error
    return (data || []).map((user) => this.toCamelCase(user))
  }

  async getNavigationConfig(): Promise<NavigationConfig[]> {
    const { data, error } = await this.supabase.from("navigation_settings").select("*").order("sort_order")

    if (error) throw error
    return (data || []).map((config) => this.toCamelCase(config))
  }

  async getInitiatives(): Promise<InitiativeWithRelations[]> {
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

    if (error) throw error
    return (data || []).map((initiative) => this.toCamelCase(initiative))
  }

  async getAchievements(): Promise<Achievement[]> {
    const { data, error } = await this.supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data || []).map((achievement) => this.toCamelCase(achievement))
  }

  async getConfigItems(): Promise<ConfigItem[]> {
    const { data, error } = await this.supabase.from("config_items").select("*").order("sort_order")

    if (error) throw error
    return (data || []).map((item) => this.toCamelCase(item))
  }

  async getAllConfigItems(): Promise<ConfigItem[]> {
    return this.getConfigItems()
  }

  async getFieldConfigurations(): Promise<any[]> {
    const { data, error } = await this.supabase.from("field_configurations").select("*").order("created_at")
    if (error) throw error
    return (data || []).map((item) => this.toCamelCase(item))
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

  async createInitiative(data: any): Promise<Initiative> {
    const { data: result, error } = await this.supabase
      .from("initiatives")
      .insert([this.toSnakeCase(data)])
      .select()
      .single()

    if (error) throw error
    return this.toCamelCase(result)
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

  async reorderNavigationConfig(items: { id: string; orderIndex: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await this.supabase
        .from("navigation_settings")
        .update({ sort_order: item.orderIndex })
        .eq("id", item.id)

      if (error) throw error
    }
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

  async reorderConfigItems(items: { id: string; sortOrder: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await this.supabase
        .from("config_items")
        .update({ sort_order: item.sortOrder })
        .eq("id", item.id)

      if (error) throw error
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
