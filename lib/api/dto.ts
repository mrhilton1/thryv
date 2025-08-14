import { z } from 'zod'

// User DTOs
export const CreateUserDto = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "executive", "manager", "user"]),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const UpdateUserDto = CreateUserDto.partial()

export type CreateUserRequest = z.infer<typeof CreateUserDto>
export type UpdateUserRequest = z.infer<typeof UpdateUserDto>

// Initiative DTOs
export const CreateInitiativeDto = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required"),
  goal: z.string().optional(),
  productArea: z.string().min(1, "Product area is required"),
  team: z.string().min(1, "Team is required"),
  tier: z.number().min(1).max(3).default(1),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["On Track", "At Risk", "Off Track", "Complete", "Cancelled", "Paused", "Blocked", "Deprioritized"]),
  progress: z.number().min(0).max(100).default(0),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  ownerId: z.string().min(1, "Owner is required"),
  createdById: z.string().min(1, "Creator is required"),
  // Optional fields for additional details
  businessImpact: z.string().optional(),
  processStage: z.string().optional(),
  gtmType: z.string().optional(),
})

export const UpdateInitiativeDto = CreateInitiativeDto.partial()

export type CreateInitiativeRequest = z.infer<typeof CreateInitiativeDto>
export type UpdateInitiativeRequest = z.infer<typeof UpdateInitiativeDto>

// Achievement DTOs
export const CreateAchievementDto = z.object({
  initiativeId: z.string().min(1, "Initiative ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["achievement", "milestone"]),
  dateAchieved: z.string().or(z.date()),
  createdById: z.string().min(1, "Creator is required"),
})

export const UpdateAchievementDto = CreateAchievementDto.partial().omit({ initiativeId: true })

export type CreateAchievementRequest = z.infer<typeof CreateAchievementDto>
export type UpdateAchievementRequest = z.infer<typeof UpdateAchievementDto>

// Navigation Config DTOs
export const CreateNavigationConfigDto = z.object({
  itemKey: z.string().min(1, "Item key is required"),
  itemLabel: z.string().min(1, "Item label is required"),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

export const UpdateNavigationConfigDto = CreateNavigationConfigDto.partial()

export type CreateNavigationConfigRequest = z.infer<typeof CreateNavigationConfigDto>
export type UpdateNavigationConfigRequest = z.infer<typeof UpdateNavigationConfigDto>

// Config Item DTOs
export const CreateConfigItemDto = z.object({
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
  createdById: z.string().optional(),
})

export const UpdateConfigItemDto = CreateConfigItemDto.partial().omit({ category: true })

export type CreateConfigItemRequest = z.infer<typeof CreateConfigItemDto>
export type UpdateConfigItemRequest = z.infer<typeof UpdateConfigItemDto>

// Field Configuration DTOs
export const UpdateFieldConfigurationDto = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().optional(),
  fieldType: z.string().optional(),
  options: z.array(z.string()).optional(),
})

export type UpdateFieldConfigurationRequest = z.infer<typeof UpdateFieldConfigurationDto>

// Reorder DTOs
export const ReorderItemsDto = z.array(
  z.object({
    id: z.string(),
    sortOrder: z.number(),
  })
)

export type ReorderItemsRequest = z.infer<typeof ReorderItemsDto>

// Field mappings DTOs
export const CreateFieldMappingDto = z.object({
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
  transformation: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const UpdateFieldMappingDto = CreateFieldMappingDto.partial()

export type CreateFieldMappingRequest = z.infer<typeof CreateFieldMappingDto>
export type UpdateFieldMappingRequest = z.infer<typeof UpdateFieldMappingDto>