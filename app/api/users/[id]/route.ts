import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { UserRepository } from '@/lib/api/repositories/user-repository'
import { UpdateUserDto } from '@/lib/api/dto'

const userRepository = new UserRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = BaseController.getIdFromParams(params)

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      const user = await userRepository.getById(id)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    },
    'Failed to fetch user'
  )

  if (error) {
    // Check if this is a "not found" error
    if (result === null) {
      return BaseController.createErrorResponse('User not found', 'USER_NOT_FOUND', 404)
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
    UpdateUserDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => userRepository.update(id, data),
    'Failed to update user'
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
    () => userRepository.delete(id),
    'Failed to delete user'
  )

  if (error) return error
  return BaseController.createSuccessResponse({ message: 'User deleted successfully' })
}