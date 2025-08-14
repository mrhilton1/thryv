import { BaseRepository } from "./base-repository"
import type { Initiative } from "@/lib/database/schemas"
import type { InitiativeWithRelations } from "@/types"
import type { CreateInitiativeRequest, UpdateInitiativeRequest } from "../dto"

export class InitiativeRepository extends BaseRepository {
  async getAll(): Promise<InitiativeWithRelations[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getInitiatives(),
      'InitiativeRepository.getAll'
    )
  }

  async getById(id: string): Promise<InitiativeWithRelations | null> {
    const initiatives = await this.getAll()
    return initiatives.find(initiative => initiative.id === id) || null
  }

  async create(initiativeData: CreateInitiativeRequest): Promise<Initiative> {
    return this.handleDatabaseOperation(
      () => this.databaseService.createInitiative(initiativeData),
      'InitiativeRepository.create'
    )
  }

  async update(id: string, updates: UpdateInitiativeRequest): Promise<Initiative> {
    return this.handleDatabaseOperation(
      () => this.databaseService.updateInitiative(id, updates),
      'InitiativeRepository.update'
    )
  }

  async delete(id: string): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.deleteInitiative(id),
      'InitiativeRepository.delete'
    )
  }

  async getByOwner(ownerId: string): Promise<Initiative[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getInitiativesByOwner(ownerId),
      'InitiativeRepository.getByOwner'
    )
  }

  async getByCreator(creatorId: string): Promise<Initiative[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getInitiativesByCreator(creatorId),
      'InitiativeRepository.getByCreator'
    )
  }

  async getByStatus(status: string): Promise<InitiativeWithRelations[]> {
    const initiatives = await this.getAll()
    return initiatives.filter(initiative => initiative.status === status)
  }

  async getByTier(tier: number): Promise<InitiativeWithRelations[]> {
    const initiatives = await this.getAll()
    return initiatives.filter(initiative => initiative.tier === tier)
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<InitiativeWithRelations[]> {
    const initiatives = await this.getAll()
    return initiatives.filter(initiative => {
      const initStartDate = new Date(initiative.startDate)
      const initEndDate = new Date(initiative.endDate)
      return (initStartDate <= endDate && initEndDate >= startDate)
    })
  }
}