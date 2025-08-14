import { SupabaseDatabaseService } from "@/lib/supabase/database-service"

export abstract class BaseRepository {
  protected databaseService: SupabaseDatabaseService

  constructor() {
    this.databaseService = new SupabaseDatabaseService()
  }

  protected async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      console.error(`Repository error in ${errorContext}:`, error)
      throw error
    }
  }
}