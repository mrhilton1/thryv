import { QueryBuilder } from './query-builder'
import { 
  User, Initiative, InitiativeNote, Attachment, Achievement, ExecutiveSummary, ConfigItem,
  UserSchema, InitiativeSchema, InitiativeNoteSchema, AttachmentSchema, 
  AchievementSchema, ExecutiveSummarySchema, ConfigItemSchema,
  InitiativeWithRelations, AchievementWithRelations, ExecutiveSummaryWithRelations,
  NavigationConfig, NavigationConfigSchema
} from './schemas'

export interface DatabaseConfig {
  users: User[]
  initiatives: Initiative[]
  notes: InitiativeNote[]
  attachments: Attachment[]
  achievements: Achievement[]
  executiveSummaries: ExecutiveSummary[]
  configItems: {
    teams: ConfigItem[]
    businessImpacts: ConfigItem[]
    productAreas: ConfigItem[]
    processStages: ConfigItem[]
    priorities: ConfigItem[]
    statuses: ConfigItem[]
    gtmTypes: ConfigItem[]
  }
  navigationConfig?: NavigationConfig[]
}

export class Database {
  private config: DatabaseConfig

  constructor(initialData: Partial<DatabaseConfig> = {}) {
    this.config = {
      users: [],
      initiatives: [],
      notes: [],
      attachments: [],
      achievements: [],
      executiveSummaries: [],
      configItems: {
        teams: [],
        businessImpacts: [],
        productAreas: [],
        processStages: [],
        priorities: [],
        statuses: [],
        gtmTypes: []
      },
      navigationConfig: [],
      ...initialData
    }
  }

  // User operations
  users() {
    return new QueryBuilder(this.config.users)
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date().toISOString()
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    }
    
    const validatedUser = UserSchema.parse(user)
    this.config.users.push(validatedUser)
    return validatedUser
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const userIndex = this.config.users.findIndex(u => u.id === id)
    if (userIndex === -1) return null

    const updatedUser = {
      ...this.config.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const validatedUser = UserSchema.parse(updatedUser)
    this.config.users[userIndex] = validatedUser
    return validatedUser
  }

  deleteUser(id: string): boolean {
    const initialLength = this.config.users.length
    this.config.users = this.config.users.filter(u => u.id !== id)
    return this.config.users.length < initialLength
  }

  // Initiative operations
  initiatives() {
    return new QueryBuilder(this.config.initiatives)
  }

  createInitiative(initiativeData: Omit<Initiative, 'id' | 'createdAt' | 'lastUpdated'>): Initiative {
    const now = new Date().toISOString()
    
    // Clean and validate the data before creating the initiative
    const cleanedData = {
      // Ensure required fields have values with proper defaults
      title: initiativeData.title?.trim() || '',
      description: initiativeData.description?.trim() || '',
      goal: initiativeData.goal?.trim() || undefined,
      productArea: initiativeData.productArea?.trim() || '',
      team: initiativeData.team?.trim() || '',
      tier: typeof initiativeData.tier === 'number' ? initiativeData.tier : 1,
      ownerId: initiativeData.ownerId?.trim() || '',
      status: initiativeData.status?.trim() || 'On Track',
      processStage: initiativeData.processStage?.trim() || 'Planned',
      priority: initiativeData.priority?.trim() || 'Medium',
      businessImpact: initiativeData.businessImpact?.trim() || 'Increase Revenue',
      // Handle optional date fields - convert empty strings to undefined
      startDate: initiativeData.startDate && initiativeData.startDate.trim() ? initiativeData.startDate.trim() : undefined,
      estimatedReleaseDate: initiativeData.estimatedReleaseDate && initiativeData.estimatedReleaseDate.trim() ? initiativeData.estimatedReleaseDate.trim() : undefined,
      actualReleaseDate: initiativeData.actualReleaseDate && initiativeData.actualReleaseDate.trim() ? initiativeData.actualReleaseDate.trim() : undefined,
      estimatedGTMType: initiativeData.estimatedGTMType?.trim() || undefined,
      progress: typeof initiativeData.progress === 'number' ? Math.max(0, Math.min(100, initiativeData.progress)) : 0,
      tags: Array.isArray(initiativeData.tags) ? initiativeData.tags.filter(tag => tag && tag.trim()) : [],
      executiveUpdate: initiativeData.executiveUpdate?.trim() || undefined,
      reasonIfNotOnTrack: initiativeData.reasonIfNotOnTrack?.trim() || undefined,
      createdById: initiativeData.createdById?.trim() || '',
      lastUpdatedById: initiativeData.lastUpdatedById?.trim() || '',
      showOnExecutiveSummary: Boolean(initiativeData.showOnExecutiveSummary)
    }

    const initiative: Initiative = {
      ...cleanedData,
      id: this.generateId(),
      createdAt: now,
      lastUpdated: now
    }
    
    console.log('Creating initiative with cleaned data:', initiative)
    
    try {
      const validatedInitiative = InitiativeSchema.parse(initiative)
      this.config.initiatives.push(validatedInitiative)
      console.log('Initiative created successfully:', validatedInitiative.id)
      return validatedInitiative
    } catch (error) {
      console.error('Validation error when creating initiative:', error)
      console.error('Initiative data that failed validation:', initiative)
      throw error
    }
  }

  updateInitiative(id: string, updates: Partial<Omit<Initiative, 'id' | 'createdAt'>>, updatedById: string): Initiative | null {
    const initiativeIndex = this.config.initiatives.findIndex(i => i.id === id)
    if (initiativeIndex === -1) return null

    const currentInitiative = this.config.initiatives[initiativeIndex]

    // Clean the updates data similar to create, but preserve existing values
    const cleanedUpdates: Partial<Initiative> = {}
    
    // Only update fields that are provided
    if (updates.title !== undefined) cleanedUpdates.title = updates.title.trim()
    if (updates.description !== undefined) cleanedUpdates.description = updates.description.trim()
    if (updates.goal !== undefined) cleanedUpdates.goal = updates.goal?.trim() || undefined
    if (updates.productArea !== undefined) cleanedUpdates.productArea = updates.productArea.trim()
    if (updates.team !== undefined) cleanedUpdates.team = updates.team.trim()
    if (updates.tier !== undefined) cleanedUpdates.tier = typeof updates.tier === 'number' ? updates.tier : 1
    if (updates.ownerId !== undefined) cleanedUpdates.ownerId = updates.ownerId.trim()
    if (updates.status !== undefined) cleanedUpdates.status = updates.status.trim()
    if (updates.processStage !== undefined) cleanedUpdates.processStage = updates.processStage.trim()
    if (updates.priority !== undefined) cleanedUpdates.priority = updates.priority.trim()
    if (updates.businessImpact !== undefined) cleanedUpdates.businessImpact = updates.businessImpact.trim()
    
    // Handle date fields
    if (updates.startDate !== undefined) {
      cleanedUpdates.startDate = updates.startDate && updates.startDate.trim() ? updates.startDate.trim() : undefined
    }
    if (updates.estimatedReleaseDate !== undefined) {
      cleanedUpdates.estimatedReleaseDate = updates.estimatedReleaseDate && updates.estimatedReleaseDate.trim() ? updates.estimatedReleaseDate.trim() : undefined
    }
    if (updates.actualReleaseDate !== undefined) {
      cleanedUpdates.actualReleaseDate = updates.actualReleaseDate && updates.actualReleaseDate.trim() ? updates.actualReleaseDate.trim() : undefined
    }
    if (updates.estimatedGTMType !== undefined) {
      cleanedUpdates.estimatedGTMType = updates.estimatedGTMType?.trim() || undefined
    }
    
    // Handle other fields
    if (updates.progress !== undefined) {
      cleanedUpdates.progress = typeof updates.progress === 'number' ? Math.max(0, Math.min(100, updates.progress)) : 0
    }
    if (updates.tags !== undefined) {
      cleanedUpdates.tags = Array.isArray(updates.tags) ? updates.tags.filter(tag => tag && tag.trim()) : []
    }
    if (updates.executiveUpdate !== undefined) {
      cleanedUpdates.executiveUpdate = updates.executiveUpdate?.trim() || undefined
    }
    if (updates.reasonIfNotOnTrack !== undefined) {
      cleanedUpdates.reasonIfNotOnTrack = updates.reasonIfNotOnTrack?.trim() || undefined
    }
    if (updates.showOnExecutiveSummary !== undefined) {
      cleanedUpdates.showOnExecutiveSummary = Boolean(updates.showOnExecutiveSummary)
    }

    const updatedInitiative = {
      ...currentInitiative,
      ...cleanedUpdates,
      lastUpdated: new Date().toISOString(),
      lastUpdatedById: updatedById.trim()
    }

    try {
      const validatedInitiative = InitiativeSchema.parse(updatedInitiative)
      this.config.initiatives[initiativeIndex] = validatedInitiative
      return validatedInitiative
    } catch (error) {
      console.error('Validation error when updating initiative:', error)
      console.error('Initiative data that failed validation:', updatedInitiative)
      throw error
    }
  }

  deleteInitiative(id: string): boolean {
    const initialLength = this.config.initiatives.length
    this.config.initiatives = this.config.initiatives.filter(i => i.id !== id)
    // Also delete related notes and attachments
    this.config.notes = this.config.notes.filter(n => n.initiativeId !== id)
    this.config.attachments = this.config.attachments.filter(a => a.initiativeId !== id)
    return this.config.initiatives.length < initialLength
  }

  // Get initiative with all relationships resolved
  getInitiativeWithRelations(id: string): InitiativeWithRelations | null {
    const initiative = this.config.initiatives.find(i => i.id === id)
    if (!initiative) return null

    return this.resolveInitiativeRelations(initiative)
  }

  getAllInitiativesWithRelations(): InitiativeWithRelations[] {
    return this.config.initiatives.map(initiative => this.resolveInitiativeRelations(initiative))
  }

  private resolveInitiativeRelations(initiative: Initiative): InitiativeWithRelations {
    // Enhanced user lookup with better fallback and debugging
    const findUserById = (id: string): User => {
      // First try to find the user in active users
      let user = this.config.users.find(u => u.id === id && u.isActive)
      
      // If not found in active users, try all users
      if (!user) {
        user = this.config.users.find(u => u.id === id)
      }
      
      // If still not found, create a fallback user but log the issue
      if (!user) {
        console.warn(`User with ID ${id} not found in database. Available user IDs:`, this.config.users.map(u => u.id))
        return {
          id: id,
          name: 'Unknown User',
          email: 'unknown@example.com',
          role: 'viewer',
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      
      return user
    }

    const owner = findUserById(initiative.ownerId)
    const createdBy = findUserById(initiative.createdById)
    const lastUpdatedBy = findUserById(initiative.lastUpdatedById)
    
    const notes = this.config.notes
      .filter(n => n.initiativeId === initiative.id)
      .map(note => ({
        ...note,
        createdBy: findUserById(note.createdById)
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const attachments = this.config.attachments
      .filter(a => a.initiativeId === initiative.id)
      .map(attachment => ({
        ...attachment,
        createdBy: findUserById(attachment.createdById)
      }))

    return {
      ...initiative,
      owner,
      createdBy,
      lastUpdatedBy,
      notes,
      attachments
    }
  }

  // Note operations
  notes() {
    return new QueryBuilder(this.config.notes)
  }

  createNote(noteData: Omit<InitiativeNote, 'id' | 'createdAt'>): InitiativeNote {
    const note: InitiativeNote = {
      ...noteData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    }
    
    const validatedNote = InitiativeNoteSchema.parse(note)
    this.config.notes.push(validatedNote)
    
    // Update initiative's lastUpdated timestamp - but don't pass empty updates
    const initiative = this.config.initiatives.find(i => i.id === note.initiativeId)
    if (initiative) {
      this.updateInitiative(note.initiativeId, {}, note.createdById)
    }
    
    return validatedNote
  }

  deleteNote(id: string): boolean {
    const initialLength = this.config.notes.length
    this.config.notes = this.config.notes.filter(n => n.id !== id)
    return this.config.notes.length < initialLength
  }

  // Attachment operations
  attachments() {
    return new QueryBuilder(this.config.attachments)
  }

  createAttachment(attachmentData: Omit<Attachment, 'id' | 'createdAt'>): Attachment {
    const attachment: Attachment = {
      ...attachmentData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    }
    
    const validatedAttachment = AttachmentSchema.parse(attachment)
    this.config.attachments.push(validatedAttachment)
    return validatedAttachment
  }

  deleteAttachment(id: string): boolean {
    const initialLength = this.config.attachments.length
    this.config.attachments = this.config.attachments.filter(a => a.id !== id)
    return this.config.attachments.length < initialLength
  }

  // Achievement operations
  achievements() {
    return new QueryBuilder(this.config.achievements)
  }

  createAchievement(achievementData: Omit<Achievement, 'id' | 'createdAt'>): Achievement {
    const achievement: Achievement = {
      ...achievementData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    }
    
    console.log('Creating achievement:', achievement) // Debug log
    const validatedAchievement = AchievementSchema.parse(achievement)
    this.config.achievements.push(validatedAchievement)
    console.log('Total achievements after creation:', this.config.achievements.length) // Debug log
    return validatedAchievement
  }

  updateAchievement(id: string, updates: Partial<Omit<Achievement, 'id' | 'createdAt'>>): Achievement | null {
    const achievementIndex = this.config.achievements.findIndex(a => a.id === id)
    if (achievementIndex === -1) return null

    const updatedAchievement = {
      ...this.config.achievements[achievementIndex],
      ...updates
    }

    const validatedAchievement = AchievementSchema.parse(updatedAchievement)
    this.config.achievements[achievementIndex] = validatedAchievement
    return validatedAchievement
  }

  deleteAchievement(id: string): boolean {
    const initialLength = this.config.achievements.length
    this.config.achievements = this.config.achievements.filter(a => a.id !== id)
    return this.config.achievements.length < initialLength
  }

  getAchievementsWithRelations(): AchievementWithRelations[] {
    console.log('Getting achievements with relations, total count:', this.config.achievements.length) // Debug log
    const findUserById = (id: string): User => {
      const user = this.config.users.find(u => u.id === id)
      if (user) return user
      
      return {
        id: id,
        name: 'Unknown User',
        email: 'unknown@example.com',
        role: 'viewer',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    const result = this.config.achievements.map(achievement => ({
      ...achievement,
      createdBy: findUserById(achievement.createdById),
      initiative: achievement.initiativeId 
        ? this.config.initiatives.find(i => i.id === achievement.initiativeId)
        : undefined
    }))
    
    console.log('Achievements with relations:', result) // Debug log
    return result
  }

  // Executive Summary operations
  executiveSummaries() {
    return new QueryBuilder(this.config.executiveSummaries)
  }

  createExecutiveSummary(summaryData: Omit<ExecutiveSummary, 'id' | 'createdAt' | 'lastUpdated'>): ExecutiveSummary {
    const now = new Date().toISOString()
    const summary: ExecutiveSummary = {
      ...summaryData,
      id: this.generateId(),
      createdAt: now,
      lastUpdated: now
    }
    
    const validatedSummary = ExecutiveSummarySchema.parse(summary)
    this.config.executiveSummaries.push(validatedSummary)
    return validatedSummary
  }

  updateExecutiveSummary(id: string, updates: Partial<Omit<ExecutiveSummary, 'id' | 'createdAt'>>, updatedById: string): ExecutiveSummary | null {
    const summaryIndex = this.config.executiveSummaries.findIndex(s => s.id === id)
    if (summaryIndex === -1) return null

    const updatedSummary = {
      ...this.config.executiveSummaries[summaryIndex],
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedById: updatedById
    }

    const validatedSummary = ExecutiveSummarySchema.parse(updatedSummary)
    this.config.executiveSummaries[summaryIndex] = validatedSummary
    return validatedSummary
  }

  getExecutiveSummaryWithRelations(id: string): ExecutiveSummaryWithRelations | null {
    const summary = this.config.executiveSummaries.find(s => s.id === id)
    if (!summary) return null

    const findUserById = (id: string): User => {
      const user = this.config.users.find(u => u.id === id)
      if (user) return user
      
      return {
        id: id,
        name: 'Unknown User',
        email: 'unknown@example.com',
        role: 'viewer',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    return {
      ...summary,
      createdBy: findUserById(summary.createdById),
      updatedBy: findUserById(summary.updatedById)
    }
  }

  // Config operations
  getConfigItems(type: keyof DatabaseConfig['configItems']): ConfigItem[] {
    return this.config.configItems[type] || []
  }

  updateConfigItems(type: keyof DatabaseConfig['configItems'], items: ConfigItem[]): void {
    const validatedItems = items.map(item => ConfigItemSchema.parse(item))
    this.config.configItems[type] = validatedItems
  }

  // Enhanced navigation config operations
  getNavigationConfig(): NavigationConfig[] {
    return (this.config.navigationConfig || []).sort((a, b) => a.order - b.order)
  }

  updateNavigationConfig(configs: NavigationConfig[]): void {
    const validatedConfigs = configs.map(config => NavigationConfigSchema.parse(config))
    this.config.navigationConfig = validatedConfigs
  }

  createNavigationItem(navData: Omit<NavigationConfig, 'createdAt'>): NavigationConfig {
    const now = new Date().toISOString()
    const navItem: NavigationConfig = {
      ...navData,
      createdAt: now
    }
    
    const validatedNavItem = NavigationConfigSchema.parse(navItem)
    this.config.navigationConfig = this.config.navigationConfig || []
    this.config.navigationConfig.push(validatedNavItem)
    return validatedNavItem
  }

  updateNavigationItem(id: string, updates: Partial<NavigationConfig>): NavigationConfig | null {
    const configIndex = this.config.navigationConfig.findIndex(c => c.id === id)
    if (configIndex === -1) return null

    const updatedConfig = {
      ...this.config.navigationConfig[configIndex],
      ...updates
    }

    const validatedConfig = NavigationConfigSchema.parse(updatedConfig)
    this.config.navigationConfig[configIndex] = validatedConfig
    return validatedConfig
  }

  deleteNavigationItem(id: string): boolean {
    // Only allow deletion of custom items (not default items)
    const item = this.config.navigationConfig.find(c => c.id === id)
    if (!item || item.isDefault) return false

    const initialLength = this.config.navigationConfig.length
    this.config.navigationConfig = this.config.navigationConfig.filter(c => c.id !== id)
    return this.config.navigationConfig.length < initialLength
  }

  reorderNavigationItems(reorderedItems: NavigationConfig[]): void {
    const validatedConfigs = reorderedItems.map((config, index) => 
      NavigationConfigSchema.parse({ ...config, order: index })
    )
    this.config.navigationConfig = validatedConfigs
  }

  // Search operations - Fixed to handle undefined relationships
  searchInitiatives(query: string): InitiativeWithRelations[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    
    return this.getAllInitiativesWithRelations().filter(initiative => {
      // Build searchable text with safe property access
      const searchableFields = [
        initiative.title || '',
        initiative.description || '',
        initiative.goal || '',
        initiative.productArea || '',
        initiative.team || '',
        initiative.status || '',
        initiative.priority || '',
        initiative.businessImpact || '',
        initiative.processStage || '',
        initiative.estimatedGTMType || '',
        initiative.owner?.name || '',
        initiative.owner?.email || '',
        initiative.createdBy?.name || '',
        initiative.lastUpdatedBy?.name || '',
        ...(initiative.tags || []),
        ...(initiative.notes?.map(note => note.content || '') || []),
        ...(initiative.attachments?.map(att => att.name || '') || [])
      ]

      const searchableText = searchableFields.join(' ').toLowerCase()

      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  // Analytics operations
  getInitiativeStats() {
    const initiatives = this.config.initiatives
    const total = initiatives.length
    const completed = initiatives.filter(i => i.status === 'Complete').length
    const inProgress = initiatives.filter(i => i.status === 'On Track').length
    const atRisk = initiatives.filter(i => ['At Risk', 'Off Track'].includes(i.status)).length
    const avgProgress = total > 0 ? initiatives.reduce((sum, i) => sum + (i.progress || 0), 0) / total : 0
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return {
      total,
      completed,
      inProgress,
      atRisk,
      avgProgress,
      completionRate,
      byStatus: this.initiatives().groupBy('status'),
      byPriority: this.initiatives().groupBy('priority'),
      byProductArea: this.initiatives().groupBy('productArea')
    }
  }

  // Utility methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Export/Import
  export(): DatabaseConfig {
    return JSON.parse(JSON.stringify(this.config))
  }

  import(data: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...data }
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      this.config.users.forEach(user => UserSchema.parse(user))
      this.config.initiatives.forEach(initiative => InitiativeSchema.parse(initiative))
      this.config.notes.forEach(note => InitiativeNoteSchema.parse(note))
      this.config.attachments.forEach(attachment => AttachmentSchema.parse(attachment))
      this.config.achievements.forEach(achievement => AchievementSchema.parse(achievement))
      this.config.executiveSummaries.forEach(summary => ExecutiveSummarySchema.parse(summary))
    } catch (error: any) {
      errors.push(error.message)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
