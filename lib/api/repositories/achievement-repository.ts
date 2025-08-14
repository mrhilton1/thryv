import { BaseRepository } from "./base-repository"
import type { Achievement } from "@/lib/database/schemas"
import type { CreateAchievementRequest, UpdateAchievementRequest } from "../dto"

export class AchievementRepository extends BaseRepository {
  async getAll(): Promise<Achievement[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getAchievements(),
      'AchievementRepository.getAll'
    )
  }

  async getById(id: string): Promise<Achievement | null> {
    const achievements = await this.getAll()
    return achievements.find(achievement => achievement.id === id) || null
  }

  async create(achievementData: CreateAchievementRequest): Promise<Achievement> {
    return this.handleDatabaseOperation(
      () => this.databaseService.createAchievement(achievementData),
      'AchievementRepository.create'
    )
  }

  async update(id: string, updates: UpdateAchievementRequest): Promise<Achievement> {
    return this.handleDatabaseOperation(
      () => this.databaseService.updateAchievement(id, updates),
      'AchievementRepository.update'
    )
  }

  async delete(id: string): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.deleteAchievement(id),
      'AchievementRepository.delete'
    )
  }

  async getByInitiative(initiativeId: string): Promise<Achievement[]> {
    const achievements = await this.getAll()
    return achievements.filter(achievement => achievement.initiativeId === initiativeId)
  }

  async getByType(type: 'achievement' | 'milestone'): Promise<Achievement[]> {
    const achievements = await this.getAll()
    return achievements.filter(achievement => achievement.type === type)
  }

  async getByCreator(creatorId: string): Promise<Achievement[]> {
    const achievements = await this.getAll()
    return achievements.filter(achievement => achievement.createdById === creatorId)
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<Achievement[]> {
    const achievements = await this.getAll()
    return achievements.filter(achievement => {
      const achievedDate = new Date(achievement.dateAchieved)
      return achievedDate >= startDate && achievedDate <= endDate
    })
  }
}