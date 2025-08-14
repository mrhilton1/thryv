import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { z } from 'zod'

const configRepository = new ConfigRepository()

const ReorderFieldConfigurationsDto = z.array(
  z.object({
    id: z.string(),
    order: z.number(),
  })
)

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    ReorderFieldConfigurationsDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.reorderFieldConfigurations(data),
    'Failed to reorder field configurations'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'Field configurations reordered successfully' })
}