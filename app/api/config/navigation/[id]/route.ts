import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { UpdateNavigationConfigDto } from '@/lib/api/dto'

const configRepository = new ConfigRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      const config = await configRepository.getNavigationConfigById(id)
      if (!config) {
        throw new Error('Navigation config not found')
      }
      return config
    },
    'Failed to fetch navigation config'
  )

  if (error) {
    // Check if this is a "not found" error
    if (result === null) {
      return BaseController.createErrorResponse('Navigation config not found', 'NAV_CONFIG_NOT_FOUND', 404)
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
    UpdateNavigationConfigDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.updateNavigationConfig(id, data),
    'Failed to update navigation config'
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
    () => configRepository.deleteNavigationConfig(id),
    'Failed to delete navigation config'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'Navigation config deleted successfully' })
}