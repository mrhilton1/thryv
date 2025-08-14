import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { AchievementRepository } from '@/lib/api/repositories/achievement-repository'
import { UpdateAchievementDto } from '@/lib/api/dto'

const achievementRepository = new AchievementRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      const achievement = await achievementRepository.getById(id)
      if (!achievement) {
        throw new Error('Achievement not found')
      }
      return achievement
    },
    'Failed to fetch achievement'
  )

  if (error) {
    // Check if this is a "not found" error
    if (result === null) {
      return BaseController.createErrorResponse('Achievement not found', 'ACHIEVEMENT_NOT_FOUND', 404)
    }
    return error
  }
  return BaseController.createSuccessResponse(result)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { data, error: validationError } = await BaseController.validateBody(
    request,
    UpdateAchievementDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => achievementRepository.update(id, data),
    'Failed to update achievement'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { result, error } = await BaseController.handleAsyncOperation(
    () => achievementRepository.delete(id),
    'Failed to delete achievement'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'Achievement deleted successfully' })
}