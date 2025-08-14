import { BaseRepository } from "./base-repository"
import type { User } from "@/lib/database/schemas"
import type { CreateUserRequest, UpdateUserRequest } from "../dto"

export class UserRepository extends BaseRepository {
  async getAll(): Promise<User[]> {
    return this.handleDatabaseOperation(
      () => this.databaseService.getUsers(),
      'UserRepository.getAll'
    )
  }

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll()
    return users.find(user => user.id === id) || null
  }

  async create(userData: CreateUserRequest): Promise<User> {
    return this.handleDatabaseOperation(
      () => this.databaseService.createUser(userData),
      'UserRepository.create'
    )
  }

  async update(id: string, updates: UpdateUserRequest): Promise<User> {
    return this.handleDatabaseOperation(
      () => this.databaseService.updateUser(id, updates),
      'UserRepository.update'
    )
  }

  async delete(id: string): Promise<void> {
    return this.handleDatabaseOperation(
      () => this.databaseService.deleteUser(id),
      'UserRepository.delete'
    )
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.getAll()
    return users.find(user => user.email === email) || null
  }

  async getByRole(role: string): Promise<User[]> {
    const users = await this.getAll()
    return users.filter(user => user.role === role)
  }
}