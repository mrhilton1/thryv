import { BaseRepository } from "./base-repository"
import type { ConfigItem, NavigationConfig } from "@/lib/database/schemas"
import type { 
  CreateConfigItemRequest, 
  UpdateConfigItemRequest,
  CreateNavigationConfigRequest,
  UpdateNavigationConfigRequest,
  ReorderItemsRequest,
  UpdateFieldConfigurationRequest
} from "../dto"

export class ConfigRepository extends BaseRepository {
  // Config Items
  async getAllConfigItems(): Promise<ConfigItem[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getAllConfigItems(),
      'ConfigRepository.getAllConfigItems'
    )
  }

  async getConfigItemsByCategory(category: string): Promise<ConfigItem[]> {
    const allItems = await this.getAllConfigItems()
    return allItems.filter(item => item.category === category)
  }

  async createConfigItem(itemData: CreateConfigItemRequest): Promise<ConfigItem> {
    return this.handleDatabaseOperation(
      () => this.databaseService.createConfigItem(itemData),
      'ConfigRepository.createConfigItem'
    )
  }

  async updateConfigItem(id: string, updates: UpdateConfigItemRequest): Promise<ConfigItem> {
    return this.handleDatabaseOperation(
      () => this.databaseService.updateConfigItem(id, updates),
      'ConfigRepository.updateConfigItem'
    )
  }

  async deleteConfigItem(id: string): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.deleteConfigItem(id),
      'ConfigRepository.deleteConfigItem'
    )
  }

  async reorderConfigItems(category: string, updates: ReorderItemsRequest): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.reorderConfigItems(category, updates),
      'ConfigRepository.reorderConfigItems'
    )
  }

  // Navigation Config
  async getAllNavigationConfig(): Promise<NavigationConfig[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getNavigationConfig(),
      'ConfigRepository.getAllNavigationConfig'
    )
  }

  async getNavigationConfigById(id: string): Promise<NavigationConfig | null> {
    const configs = await this.getAllNavigationConfig()
    return configs.find(config => config.id === id) || null
  }

  async createNavigationConfig(configData: CreateNavigationConfigRequest): Promise<NavigationConfig> {
    return this.handleDatabaseOperation(
      () => this.databaseService.createNavigationConfig(configData),
      'ConfigRepository.createNavigationConfig'
    )
  }

  async updateNavigationConfig(id: string, updates: UpdateNavigationConfigRequest): Promise<NavigationConfig> {
    return this.handleDatabaseOperation(
      () => this.databaseService.updateNavigationConfig(id, updates),
      'ConfigRepository.updateNavigationConfig'
    )
  }

  async deleteNavigationConfig(id: string): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.deleteNavigationConfig(id),
      'ConfigRepository.deleteNavigationConfig'
    )
  }

  async reorderNavigationConfig(updates: ReorderItemsRequest): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.reorderNavigationConfig(updates),
      'ConfigRepository.reorderNavigationConfig'
    )
  }

  // Field Configurations
  async getAllFieldConfigurations(): Promise<any[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getFieldConfigurations(),
      'ConfigRepository.getAllFieldConfigurations'
    )
  }

  async updateFieldConfiguration(id: string, updates: UpdateFieldConfigurationRequest): Promise<any> {
    return this.handleDatabaseOperation(
      () => this.databaseService.updateFieldConfiguration(id, updates),
      'ConfigRepository.updateFieldConfiguration'
    )
  }

  async reorderFieldConfigurations(updates: { id: string; order: number }[]): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.reorderFieldConfigurations(updates),
      'ConfigRepository.reorderFieldConfigurations'
    )
  }

  // Field Mappings
  async getAllFieldMappings(): Promise<any[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getFieldMappings(),
      'ConfigRepository.getAllFieldMappings'
    )
  }

  async createFieldMapping(mappingData: any): Promise<any> {
    return this.handleDatabaseOperation(
      () => this.databaseService.createFieldMapping(mappingData),
      'ConfigRepository.createFieldMapping'
    )
  }

  async updateFieldMapping(id: string, updates: any): Promise<any> {
    return this.handleDatabaseOperation(
      () => this.databaseService.updateFieldMapping(id, updates),
      'ConfigRepository.updateFieldMapping'
    )
  }

  async deleteFieldMapping(id: string): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.deleteFieldMapping(id),
      'ConfigRepository.deleteFieldMapping'
    )
  }
}