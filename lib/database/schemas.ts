import { z } from "zod"

// Base schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "editor", "viewer"]),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ConfigItemSchema = z.object({
  id: z.string(),
  category: z.enum([
    "teams",
    "business_impacts",
    "product_areas",
    "process_stages",
    "priorities",
    "statuses",
    "gtm_types",
  ]),
  label: z.string().min(1, "Label is required"),
  color: z.enum(["gray", "red", "orange", "yellow", "green", "blue", "purple", "pink"]).default("gray"),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdById: z.string().optional(),
})

export const InitiativeNoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Note content is required"),
  createdAt: z.string().datetime(),
  createdById: z.string(),
  initiativeId: z.string(),
})

export const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Attachment name is required"),
  url: z.string().url("Invalid URL format"),
  type: z.enum(["file", "link"]),
  initiativeId: z.string(),
  createdAt: z.string().datetime(),
  createdById: z.string(),
})

export const InitiativeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required"),
  goal: z.string().optional(),
  productArea: z.string().min(1, "Product area is required"),
  team: z.string().min(1, "Team is required"),
  tier: z.number().min(1).max(3).default(1),
  ownerId: z.string().min(1, "Owner is required"),
  status: z.string().min(1, "Status is required"),
  reasonIfNotOnTrack: z.string().optional(),
  processStage: z.string().min(1, "Process stage is required"),
  priority: z.string().min(1, "Priority is required"),
  businessImpact: z.string().min(1, "Business impact is required"),
  startDate: z.string().optional(),
  estimatedReleaseDate: z.string().optional(),
  actualReleaseDate: z.string().optional(),
  estimatedGTMType: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  tags: z.array(z.string()).default([]),
  executiveUpdate: z.string().optional(),
  createdAt: z.string().datetime(),
  createdById: z.string().min(1, "Created by is required"),
  lastUpdated: z.string().datetime(),
  lastUpdatedById: z.string().min(1, "Last updated by is required"),
  showOnExecutiveSummary: z.boolean().default(false),
})

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().default("CheckCircle"),
  type: z.enum(["achievement", "milestone"]),
  createdAt: z.string().datetime(),
  createdById: z.string(),
  initiativeId: z.string().optional(),
})

export const ExecutiveSummarySchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  highlights: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  createdById: z.string(),
  lastUpdated: z.string().datetime(),
  updatedById: z.string(),
})

export const NavigationConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  route: z.string().optional(),
  permission: z.string().default("read"),
  isVisible: z.boolean().default(true),
  order: z.number().default(0),
  isDefault: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  createdById: z.string().optional(),
})

// Type exports
export type User = z.infer<typeof UserSchema>
export type ConfigItem = z.infer<typeof ConfigItemSchema>
export type InitiativeNote = z.infer<typeof InitiativeNoteSchema>
export type Attachment = z.infer<typeof AttachmentSchema>
export type Initiative = z.infer<typeof InitiativeSchema>
export type Achievement = z.infer<typeof AchievementSchema>
export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>
export type NavigationConfig = z.infer<typeof NavigationConfigSchema>

// Extended types with relationships
export interface InitiativeWithRelations extends Initiative {
  owner: User | null
  createdBy: User | null
  lastUpdatedBy: User | null
  notes: (InitiativeNote & { createdBy: User })[]
  attachments: (Attachment & { createdBy: User })[]
}

export interface AchievementWithRelations extends Achievement {
  createdBy: User
  initiative?: Initiative
}

export interface ExecutiveSummaryWithRelations extends ExecutiveSummary {
  createdBy: User
  updatedBy: User
}

// Config items organized by category
export interface ConfigItemsByCategory {
  teams: ConfigItem[]
  businessImpacts: ConfigItem[]
  productAreas: ConfigItem[]
  processStages: ConfigItem[]
  priorities: ConfigItem[]
  statuses: ConfigItem[]
  gtmTypes: ConfigItem[]
}

// Additional types for CRUD operations
export interface FieldConfiguration {
  id: string
  section: string
  fieldName: string
  fieldType: "text" | "textarea" | "select" | "multiselect" | "date" | "number" | "boolean"
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  order: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateInitiativeData {
  title: string
  description: string
  goal?: string
  productArea: string
  team: string
  tier: number
  ownerId: string
  status: string
  processStage: string
  priority: string
  businessImpact: string
  startDate?: string
  estimatedReleaseDate?: string
  actualReleaseDate?: string
  estimatedGtmType?: string
  progress: number
  tags: string[]
  executiveUpdate?: string
  createdById: string
  lastUpdatedById: string
  showOnExecutiveSummary: boolean
}

export interface UpdateInitiativeData extends Partial<CreateInitiativeData> {
  lastUpdatedById: string
}

export interface CreateAchievementData {
  title: string
  description: string
  type: "achievement" | "milestone"
  dateAchieved: string
  createdById: string
  initiativeId?: string
}

export interface UpdateAchievementData extends Partial<CreateAchievementData> {}

export interface CreateConfigItemData {
  category: string
  label: string
  color: string
  sortOrder: number
  isActive: boolean
  createdById?: string
}

export interface UpdateConfigItemData extends Partial<CreateConfigItemData> {}

export interface UpdateFieldConfigurationData extends Partial<FieldConfiguration> {}

export interface CreateNavigationConfigData {
  name: string
  description?: string
  icon?: string
  route?: string
  permission: string
  isVisible: boolean
  order: number
  isDefault: boolean
  createdById?: string
}

export interface UpdateNavigationConfigData extends Partial<CreateNavigationConfigData> {}
