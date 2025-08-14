import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { CreateNavigationConfigDto } from '@/lib/api/dto'

const configRepository = new ConfigRepository()

export async function GET(request: NextRequest) {
  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.getAllNavigationConfig(),
    'Failed to fetch navigation config'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result, { total: result.length })
}

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    CreateNavigationConfigDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.createNavigationConfig(data),
    'Failed to create navigation config'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}