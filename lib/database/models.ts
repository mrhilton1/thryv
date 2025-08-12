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

// Type exports
export type User = z.infer<typeof UserSchema>
export type Initiative = z.infer<typeof InitiativeSchema>
export type InitiativeNote = z.infer<typeof InitiativeNoteSchema>
export type Attachment = z.infer<typeof AttachmentSchema>
