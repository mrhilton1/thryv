import { z } from "zod"

// Base schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "executive", "manager", "user"]),
  avatar: z.string().nullable().optional(),
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
  color: z.enum(["gray", "red", "orange", "yellow", "green", "blue", "purple", "pink"]).nullable().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdById: z.string().optional(),
})

export const FieldConfigurationSchema = z.object({
  id: z.string(),
  sectionName: z.string().min(1, "Section name is required"),
  fieldName: z.string().min(1, "Field name is required"),
  fieldLabel: z.string().min(1, "Display label is required"),
  fieldType: z.enum(["text", "textarea", "select", "number", "date", "boolean"]),
  isVisible: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const NavigationConfigSchema = z.object({
  id: z.string(),
  itemKey: z.string().min(1, "Name is required"),
  itemLabel: z.string().min(1, "Label is required"),
  itemIcon: z.string().nullable().optional(),
  itemRoute: z.string().nullable().optional(),
  itemDescription: z.string().nullable().optional(),
  isVisible: z.boolean().default(true),
  isCustom: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
  description: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  productArea: z.string().min(1, "Product area is required"),
  ownerId: z.string().nullable().optional(),
  team: z.string().min(1, "Team is required"),
  tier: z.number().min(1).max(3).default(1),
  status: z.string().min(1, "Status is required"),
  processStage: z.string().min(1, "Process stage is required"),
  priority: z.string().min(1, "Priority is required"),
  businessImpact: z.string().min(1, "Business impact is required"),
  startDate: z.string().nullable().optional(),
  estimatedReleaseDate: z.string().nullable().optional(),
  actualReleaseDate: z.string().nullable().optional(),
  estimatedGtmType: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).default(0),
  tags: z.array(z.string()).nullable().default([]),
  executiveUpdate: z.string().nullable().optional(),
  reasonIfNotOnTrack: z.string().nullable().optional(),
  showOnExecutiveSummary: z.boolean().default(false),
  attachments: z.array(z.string()).nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastUpdated: z.string().nullable().optional(),
})

export const AchievementSchema = z.object({
  id: z.string(),
  initiativeId: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  achievementType: z.enum(["achievement", "milestone"]),
  dateAchieved: z.string().datetime(),
  createdById: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ExecutiveSummarySchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  highlights: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  summaryDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  createdById: z.string(),
  updatedAt: z.string().datetime(),
})

// Type exports
export type User = z.infer<typeof UserSchema>
export type ConfigItem = z.infer<typeof ConfigItemSchema>
export type FieldConfiguration = z.infer<typeof FieldConfigurationSchema>
export type NavigationConfig = z.infer<typeof NavigationConfigSchema>
export type InitiativeNote = z.infer<typeof InitiativeNoteSchema>
export type Attachment = z.infer<typeof AttachmentSchema>
export type Initiative = z.infer<typeof InitiativeSchema>
export type Achievement = z.infer<typeof AchievementSchema>
export type ExecutiveSummary = z.infer<typeof ExecutiveSummarySchema>

// Create/Update schemas for database operations
export const CreateInitiativeSchema = InitiativeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUpdated: true,
}).extend({
  lastUpdatedById: z.string().min(1, "Last updated by is required"),
})

export const UpdateInitiativeSchema = CreateInitiativeSchema.partial().extend({
  lastUpdatedById: z.string().min(1, "Last updated by is required"),
})

export const CreateAchievementSchema = AchievementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateAchievementSchema = CreateAchievementSchema.partial()

export const CreateConfigItemSchema = ConfigItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateConfigItemSchema = CreateConfigItemSchema.partial()

export const CreateFieldConfigurationSchema = FieldConfigurationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateFieldConfigurationSchema = CreateFieldConfigurationSchema.partial()

export const CreateNavigationConfigSchema = NavigationConfigSchema.omit({
  id: true,
  createdAt: true,
})

export const UpdateNavigationConfigSchema = CreateNavigationConfigSchema.partial()

export type CreateInitiativeData = z.infer<typeof CreateInitiativeSchema>
export type UpdateInitiativeData = z.infer<typeof UpdateInitiativeSchema>
export type CreateAchievementData = z.infer<typeof CreateAchievementSchema>
export type UpdateAchievementData = z.infer<typeof UpdateAchievementSchema>
export type CreateConfigItemData = z.infer<typeof CreateConfigItemSchema>
export type UpdateConfigItemData = z.infer<typeof UpdateConfigItemSchema>
export type CreateFieldConfigurationData = z.infer<typeof CreateFieldConfigurationSchema>
export type UpdateFieldConfigurationData = z.infer<typeof UpdateFieldConfigurationSchema>
export type CreateNavigationConfigData = z.infer<typeof CreateNavigationConfigSchema>
export type UpdateNavigationConfigData = z.infer<typeof UpdateNavigationConfigSchema>

// Extended types with relationships
export interface InitiativeWithRelations extends Initiative {
  owner?: User | null
  createdBy?: User | null
  lastUpdatedBy?: User | null
  notes: (InitiativeNote & { createdBy: User })[]
  attachments: (Attachment & { createdBy: User })[]
}

export interface AchievementWithRelations extends Achievement {
  createdBy?: User
  initiative?: Initiative
}

export interface ExecutiveSummaryWithRelations extends ExecutiveSummary {
  createdBy: User
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

// Field configurations organized by section
export interface FieldConfigurationsBySection {
  basicInformation: FieldConfiguration[]
  statusProgress: FieldConfiguration[]
  timelineDates: FieldConfiguration[]
  additionalDetails: FieldConfiguration[]
}
