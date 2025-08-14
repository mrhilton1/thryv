import type { ApiResponse } from './base-controller'
import type {
  CreateUserRequest,
  UpdateUserRequest,
  CreateInitiativeRequest,
  UpdateInitiativeRequest,
  CreateAchievementRequest,
  UpdateAchievementRequest,
  CreateNavigationConfigRequest,
  UpdateNavigationConfigRequest,
  CreateConfigItemRequest,
  UpdateConfigItemRequest,
  ReorderItemsRequest,
  UpdateFieldConfigurationRequest
} from './dto'
import type { User, Initiative, Achievement, ConfigItem, NavigationConfig } from '@/lib/database/schemas'
import type { InitiativeWithRelations } from '@/types'

class ApiClient {
  private baseUrl = '/api'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        success: false, 
        error: { message: 'Network error', code: 'NETWORK_ERROR' } 
      }))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // User API methods
  async getUsers(params?: { role?: string; email?: string }): Promise<User[]> {
    const searchParams = new URLSearchParams()
    if (params?.role) searchParams.set('role', params.role)
    if (params?.email) searchParams.set('email', params.email)
    
    const query = searchParams.toString()
    const response = await this.request<User[]>(`/users${query ? `?${query}` : ''}`)
    return response.data || []
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}`)
    if (!response.data) throw new Error('User not found')
    return response.data
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    if (!response.data) throw new Error('Failed to create user')
    return response.data
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    const response = await this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!response.data) throw new Error('Failed to update user')
    return response.data
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/users/${id}`, { method: 'DELETE' })
  }

  // Initiative API methods
  async getInitiatives(params?: {
    ownerId?: string
    creatorId?: string
    status?: string
    tier?: string
    startDate?: string
    endDate?: string
  }): Promise<InitiativeWithRelations[]> {
    const searchParams = new URLSearchParams()
    if (params?.ownerId) searchParams.set('ownerId', params.ownerId)
    if (params?.creatorId) searchParams.set('creatorId', params.creatorId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.tier) searchParams.set('tier', params.tier)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    const query = searchParams.toString()
    const response = await this.request<InitiativeWithRelations[]>(`/initiatives${query ? `?${query}` : ''}`)
    return response.data || []
  }

  async getInitiativeById(id: string): Promise<InitiativeWithRelations> {
    const response = await this.request<InitiativeWithRelations>(`/initiatives/${id}`)
    if (!response.data) throw new Error('Initiative not found')
    return response.data
  }

  async createInitiative(initiativeData: CreateInitiativeRequest): Promise<Initiative> {
    const response = await this.request<Initiative>('/initiatives', {
      method: 'POST',
      body: JSON.stringify(initiativeData),
    })
    if (!response.data) throw new Error('Failed to create initiative')
    return response.data
  }

  async updateInitiative(id: string, updates: UpdateInitiativeRequest): Promise<Initiative> {
    const response = await this.request<Initiative>(`/initiatives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!response.data) throw new Error('Failed to update initiative')
    return response.data
  }

  async deleteInitiative(id: string): Promise<void> {
    await this.request(`/initiatives/${id}`, { method: 'DELETE' })
  }

  // Achievement API methods
  async getAchievements(params?: {
    initiativeId?: string
    type?: string
    creatorId?: string
    startDate?: string
    endDate?: string
  }): Promise<Achievement[]> {
    const searchParams = new URLSearchParams()
    if (params?.initiativeId) searchParams.set('initiativeId', params.initiativeId)
    if (params?.type) searchParams.set('type', params.type)
    if (params?.creatorId) searchParams.set('creatorId', params.creatorId)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    const query = searchParams.toString()
    const response = await this.request<Achievement[]>(`/achievements${query ? `?${query}` : ''}`)
    return response.data || []
  }

  async getAchievementById(id: string): Promise<Achievement> {
    const response = await this.request<Achievement>(`/achievements/${id}`)
    if (!response.data) throw new Error('Achievement not found')
    return response.data
  }

  async createAchievement(achievementData: CreateAchievementRequest): Promise<Achievement> {
    const response = await this.request<Achievement>('/achievements', {
      method: 'POST',
      body: JSON.stringify(achievementData),
    })
    if (!response.data) throw new Error('Failed to create achievement')
    return response.data
  }

  async updateAchievement(id: string, updates: UpdateAchievementRequest): Promise<Achievement> {
    const response = await this.request<Achievement>(`/achievements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!response.data) throw new Error('Failed to update achievement')
    return response.data
  }

  async deleteAchievement(id: string): Promise<void> {
    await this.request(`/achievements/${id}`, { method: 'DELETE' })
  }

  // Config API methods
  async getConfigItems(category?: string): Promise<ConfigItem[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : ''
    const response = await this.request<ConfigItem[]>(`/config/items${query}`)
    return response.data || []
  }

  async createConfigItem(itemData: CreateConfigItemRequest): Promise<ConfigItem> {
    const response = await this.request<ConfigItem>('/config/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    })
    if (!response.data) throw new Error('Failed to create config item')
    return response.data
  }

  async updateConfigItem(id: string, updates: UpdateConfigItemRequest): Promise<ConfigItem> {
    const response = await this.request<ConfigItem>(`/config/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!response.data) throw new Error('Failed to update config item')
    return response.data
  }

  async deleteConfigItem(id: string): Promise<void> {
    await this.request(`/config/items/${id}`, { method: 'DELETE' })
  }

  async reorderConfigItems(category: string, items: ReorderItemsRequest): Promise<void> {
    await this.request('/config/items/reorder', {
      method: 'POST',
      body: JSON.stringify({ category, items }),
    })
  }

  // Navigation Config API methods
  async getNavigationConfig(): Promise<NavigationConfig[]> {
    const response = await this.request<NavigationConfig[]>('/config/navigation')
    return response.data || []
  }

  async getNavigationConfigById(id: string): Promise<NavigationConfig> {
    const response = await this.request<NavigationConfig>(`/config/navigation/${id}`)
    if (!response.data) throw new Error('Navigation config not found')
    return response.data
  }

  async createNavigationConfig(configData: CreateNavigationConfigRequest): Promise<NavigationConfig> {
    const response = await this.request<NavigationConfig>('/config/navigation', {
      method: 'POST',
      body: JSON.stringify(configData),
    })
    if (!response.data) throw new Error('Failed to create navigation config')
    return response.data
  }

  async updateNavigationConfig(id: string, updates: UpdateNavigationConfigRequest): Promise<NavigationConfig> {
    const response = await this.request<NavigationConfig>(`/config/navigation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!response.data) throw new Error('Failed to update navigation config')
    return response.data
  }

  async deleteNavigationConfig(id: string): Promise<void> {
    await this.request(`/config/navigation/${id}`, { method: 'DELETE' })
  }

  async reorderNavigationConfig(items: ReorderItemsRequest): Promise<void> {
    await this.request('/config/navigation/reorder', {
      method: 'POST',
      body: JSON.stringify(items),
    })
  }

  // Field Configuration API methods
  async getFieldConfigurations(): Promise<any[]> {
    const response = await this.request<any[]>('/config/field-configurations')
    return response.data || []
  }

  async updateFieldConfiguration(id: string, updates: UpdateFieldConfigurationRequest): Promise<any> {
    const response = await this.request<any>(`/config/field-configurations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!response.data) throw new Error('Failed to update field configuration')
    return response.data
  }

  async reorderFieldConfigurations(items: { id: string; order: number }[]): Promise<void> {
    await this.request('/config/field-configurations/reorder', {
      method: 'POST',
      body: JSON.stringify(items),
    })
  }

  // Field Mapping API methods
  async getFieldMappings(): Promise<any[]> {
    const response = await this.request<any[]>('/config/field-mappings')
    return response.data || []
  }

  async createFieldMapping(mappingData: any): Promise<any> {
    const response = await this.request<any>('/config/field-mappings', {
      method: 'POST',
      body: JSON.stringify(mappingData),
    })
    if (!response.data) throw new Error('Failed to create field mapping')
    return response.data
  }

  async updateFieldMapping(id: string, updates: any): Promise<any> {
    const response = await this.request<any>(`/config/field-mappings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!response.data) throw new Error('Failed to update field mapping')
    return response.data
  }

  async deleteFieldMapping(id: string): Promise<void> {
    await this.request(`/config/field-mappings/${id}`, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()