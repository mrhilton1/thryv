import { NextRequest } from 'next/server'
import { BaseController } from '@/lib/api/base-controller'
import { InitiativeRepository } from '@/lib/api/repositories/initiative-repository'
import { CreateInitiativeDto } from '@/lib/api/dto'

const initiativeRepository = new InitiativeRepository()

export async function GET(request: NextRequest) {
  const searchParams = BaseController.getSearchParams(request)
  const ownerId = searchParams.get('ownerId')
  const creatorId = searchParams.get('creatorId')
  const status = searchParams.get('status')
  const tier = searchParams.get('tier')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const { result, error } = await BaseController.handleAsyncOperation(
    async () => {
      // Handle filtering by owner
      if (ownerId) {
        return await initiativeRepository.getByOwner(ownerId)
      }
      
      // Handle filtering by creator
      if (creatorId) {
        return await initiativeRepository.getByCreator(creatorId)
      }
      
      // Get all initiatives and apply filters
      let initiatives = await initiativeRepository.getAll()
      
      // Filter by status
      if (status) {
        initiatives = initiatives.filter(initiative => initiative.status === status)
      }
      
      // Filter by tier
      if (tier) {
        const tierNum = parseInt(tier)
        if (!isNaN(tierNum)) {
          initiatives = initiatives.filter(initiative => initiative.tier === tierNum)
        }
      }
      
      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          initiatives = initiatives.filter(initiative => {
            const initStartDate = new Date(initiative.startDate)
            const initEndDate = new Date(initiative.endDate)
            return (initStartDate <= end && initEndDate >= start)
          })
        }
      }
      
      return initiatives
    },
    'Failed to fetch initiatives'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result, { total: result.length })
}

export async function POST(request: NextRequest) {
  const { data, error: validationError } = await BaseController.validateBody(
    request,
    CreateInitiativeDto
  )
  if (validationError) return validationError

  const { result, error } = await BaseController.handleAsyncOperation(
    () => initiativeRepository.create(data),
    'Failed to create initiative'
  )

  if (error) return error
  return BaseController.createSuccessResponse(result)
}