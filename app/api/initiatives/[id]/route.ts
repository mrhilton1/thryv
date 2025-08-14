import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { InitiativeRepository } from '@/lib/api/repositories/initiative-repository'
import { UpdateInitiativeDto } from '@/lib/api/dto'

const initiativeRepository = new InitiativeRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      const initiative = await initiativeRepository.getById(id)
      if (!initiative) {
        throw new Error('Initiative not found')
      }
      return initiative
    },
    'Failed to fetch initiative'
  )

  if (error) {
    // Check if this is a "not found" error
    if (result === null) {
      return BaseController.createErrorResponse('Initiative not found', 'INITIATIVE_NOT_FOUND', 404)
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
    UpdateInitiativeDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => initiativeRepository.update(id, data),
    'Failed to update initiative'
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
    () => initiativeRepository.delete(id),
    'Failed to delete initiative'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'Initiative deleted successfully' })
}