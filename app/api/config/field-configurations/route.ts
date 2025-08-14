import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'

const configRepository = new ConfigRepository()

export async function GET(request: NextRequest) {
  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.getAllFieldConfigurations(),
    'Failed to fetch field configurations'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result, { total: result.length })
}