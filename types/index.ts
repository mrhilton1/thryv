// User types
export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "executive" | "manager" | "user"
  created_at: string
  updated_at: string
}

// Initiative types
export interface Initiative {
  id: string
  title: string
  description?: string
  status: "on-track" | "at-risk" | "off-track" | "complete" | "cancelled"
  priority: "low" | "medium" | "high" | "critical"
  tier: 1 | 2 | 3
  progress: number
  start_date: string
  end_date: string
  owner_id?: string
  created_by_id?: string
  created_at: string
  updated_at: string
  owner?: User
  created_by?: User
  notes?: Note[]
  achievements?: Achievement[]
}

// Note types
export interface Note {
  id: string
  initiative_id?: string
  content: string
  created_by_id?: string
  created_at: string
  updated_at: string
  created_by?: User
  initiative?: Initiative
}

// Achievement types
export interface Achievement {
  id: string
  initiative_id?: string
  title: string
  description?: string
  type: "achievement" | "milestone"
  date_achieved: string
  created_by_id?: string
  created_at: string
  updated_at: string
  created_by?: User
  initiative?: Initiative
}

// Executive Summary types
export interface ExecutiveSummary {
  id: string
  title: string
  content: string
  summary_date: string
  created_by_id?: string
  created_at: string
  updated_at: string
  created_by?: User
}

// Navigation Settings types
export interface NavigationSetting {
  id: string
  item_key: string
  item_label: string
  is_visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Dashboard view types
export interface DashboardStats {
  totalInitiatives: number
  onTrackInitiatives: number
  atRiskInitiatives: number
  offTrackInitiatives: number
  completedInitiatives: number
  overallProgress: number
}

// Filter and sort types
export interface InitiativeFilters {
  status?: Initiative["status"][]
  priority?: Initiative["priority"][]
  tier?: Initiative["tier"][]
  owner_id?: string[]
  search?: string
}

export interface SortOption {
  field: keyof Initiative
  direction: "asc" | "desc"
}

// Form types
export interface InitiativeFormData {
  title: string
  description?: string
  status: Initiative["status"]
  priority: Initiative["priority"]
  tier: Initiative["tier"]
  progress: number
  start_date: string
  end_date: string
  owner_id?: string
}

export interface NoteFormData {
  content: string
  initiative_id?: string
}

export interface AchievementFormData {
  title: string
  description?: string
  type: Achievement["type"]
  date_achieved: string
  initiative_id?: string
}

export interface ExecutiveSummaryFormData {
  title: string
  content: string
  summary_date: string
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

// Context types
export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export interface DatabaseContextType {
  initiatives: Initiative[]
  users: User[]
  notes: Note[]
  achievements: Achievement[]
  executiveSummaries: ExecutiveSummary[]
  navigationSettings: NavigationSetting[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
  createInitiative: (data: InitiativeFormData) => Promise<Initiative>
  updateInitiative: (id: string, data: Partial<InitiativeFormData>) => Promise<Initiative>
  deleteInitiative: (id: string) => Promise<void>
  createNote: (data: NoteFormData) => Promise<Note>
  updateNote: (id: string, data: Partial<NoteFormData>) => Promise<Note>
  deleteNote: (id: string) => Promise<void>
  createAchievement: (data: AchievementFormData) => Promise<Achievement>
  updateAchievement: (id: string, data: Partial<AchievementFormData>) => Promise<Achievement>
  deleteAchievement: (id: string) => Promise<void>
  createExecutiveSummary: (data: ExecutiveSummaryFormData) => Promise<ExecutiveSummary>
  updateExecutiveSummary: (id: string, data: Partial<ExecutiveSummaryFormData>) => Promise<ExecutiveSummary>
  deleteExecutiveSummary: (id: string) => Promise<void>
  updateNavigationSetting: (id: string, data: Partial<NavigationSetting>) => Promise<NavigationSetting>
}

export interface AdminContextType {
  isAdminMode: boolean
  toggleAdminMode: () => void
  canEdit: boolean
  canDelete: boolean
  canCreate: boolean
}

// Chart and visualization types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  category?: string
}

// Export types
export interface ExportOptions {
  format: "csv" | "xlsx" | "pdf"
  includeNotes: boolean
  includeAchievements: boolean
  dateRange?: {
    start: string
    end: string
  }
  filters?: InitiativeFilters
}

// Calendar types
export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: "milestone" | "deadline" | "achievement" | "meeting"
  initiative?: Initiative
  description?: string
}

// Notification types
export interface Notification {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    url: string
  }
}

export interface InitiativeWithRelations extends Initiative {
  owner: User | null
  created_by: User | null
  notes: Note[]
  achievements: Achievement[]
}
