import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { UpdateFieldMappingDto } from '@/lib/api/dto'

const configRepository = new ConfigRepository()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { data, error: validationError } = await BaseController.validateBody(
    request,
    UpdateFieldMappingDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.updateFieldMapping(id, data),
    'Failed to update field mapping'
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
    () => configRepository.deleteFieldMapping(id),
    'Failed to delete field mapping'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'Field mapping deleted successfully' })
}