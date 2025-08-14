import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { ReorderItemsDto } from '@/lib/api/dto'

const configRepository = new ConfigRepository()

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    ReorderItemsDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.reorderNavigationConfig(data),
    'Failed to reorder navigation config'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'Navigation config reordered successfully' })
}