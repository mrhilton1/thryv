import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { ConfigRepository } from '@/lib/api/repositories/config-repository'
import { ReorderItemsDto } from '@/lib/api/dto'
import { z } from 'zod'

const configRepository = new ConfigRepository()

const ReorderConfigItemsDto = z.object({
  category: z.string().min(1, "Category is required"),
  items: ReorderItemsDto,
})

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    ReorderConfigItemsDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => configRepository.reorderConfigItems(data.category, data.items),
    'Failed to reorder config items'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'Config items reordered successfully' })
}