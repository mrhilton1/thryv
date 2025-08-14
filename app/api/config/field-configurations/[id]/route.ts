import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { UpdateFieldConfigurationDto } from '@/lib/api/dto'

const configRepository = new ConfigRepository()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { data, error: validationError } = await BaseController.validateBody(
    request,
    UpdateFieldConfigurationDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.updateFieldConfiguration(id, data),
    'Failed to update field configuration'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}