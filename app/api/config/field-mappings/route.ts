import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { CreateFieldMappingDto } from '@/lib/api/dto'

const configRepository = new ConfigRepository()

export async function GET(request: NextRequest) {
  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.getAllFieldMappings(),
    'Failed to fetch field mappings'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result, { total: result.length })
}

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    CreateFieldMappingDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.createFieldMapping(data),
    'Failed to create field mapping'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}