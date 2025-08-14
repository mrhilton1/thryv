import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { UserRepository } from '@/lib/api/repositories/user-repository'
import { CreateUserDto } from '@/lib/api/dto'

const userRepository = new UserRepository()

export async function GET(request: NextRequest) {
  const searchParams = BaseController.getSearchParams(request)
  const role = searchParams.get('role')
  const email = searchParams.get('email')

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      if (email) {
        const user = await userRepository.getByEmail(email)
        return user ? [user] : []
      }
      if (role) {
        return await userRepository.getByRole(role)
      }
      return await userRepository.getAll()
    },
    'Failed to fetch users'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    CreateUserDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => userRepository.create(data),
    'Failed to create user'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result, undefined)
}