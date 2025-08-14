import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { CreateConfigItemDto } from '@/lib/api/dto'

const configRepository = new ConfigRepository()

export async function GET(request: NextRequest) {
  const searchParams = BaseController.getSearchParams(request)
  const category = searchParams.get('category')

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      if (category) {
        return await configRepository.getConfigItemsByCategory(category)
      }
      return await configRepository.getAllConfigItems()
    },
    'Failed to fetch config items'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result, { total: result.length })
}

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    CreateConfigItemDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.createConfigItem(data),
    'Failed to create config item'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}