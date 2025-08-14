import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { AchievementRepository } from '@/lib/api/repositories/achievement-repository'
import { CreateAchievementDto } from '@/lib/api/dto'

const achievementRepository = new AchievementRepository()

export async function GET(request: NextRequest) {
  const searchParams = BaseController.getSearchParams(request)
  const initiativeId = searchParams.get('initiativeId')
  const type = searchParams.get('type')
  const creatorId = searchParams.get('creatorId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      // Handle filtering by initiative
      if (initiativeId) {
        return await achievementRepository.getByInitiative(initiativeId)
      }
      
      // Handle filtering by type
      if (type && (type === 'achievement' || type === 'milestone')) {
        return await achievementRepository.getByType(type)
      }
      
      // Handle filtering by creator
      if (creatorId) {
        return await achievementRepository.getByCreator(creatorId)
      }
      
      // Handle filtering by date range
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return await achievementRepository.getByDateRange(start, end)
        }
      }
      
      // Return all achievements
      return await achievementRepository.getAll()
    },
    'Failed to fetch achievements'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result, { total: result.length })
}

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    CreateAchievementDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => achievementRepository.create(data),
    'Failed to create achievement'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}