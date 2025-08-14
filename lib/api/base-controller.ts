import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

export class BaseController {
  protected static createSuccessResponse<T>(
    data: T,
    meta?: ApiResponse['meta']
  ): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      meta,
    })
  }

  protected static createErrorResponse(
    message: string,
    code: string = 'INTERNAL_ERROR',
    status: number = 500,
    details?: any
  ): NextResponse<ApiResponse> {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code,
          details,
        },
      },
      { status }
    )
  }

  protected static async validateBody<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
  ): Promise<{ data: T; error: NextResponse | null }> {
    try {
      const body = await request.json()
      const data = schema.parse(body)
      return { data, error: null }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          data: null as any,
          error: this.createErrorResponse(
            'Validation failed',
            'VALIDATION_ERROR',
            400,
            error.errors
          ),
        }
      }
      return {
        data: null as any,
        error: this.createErrorResponse(
          'Invalid request body',
          'INVALID_BODY',
          400
        ),
      }
    }
  }

  protected static getIdFromParams(params: { id: string }): string {
    return params.id
  }

  protected static getSearchParams(request: NextRequest) {
    return new URL(request.url).searchParams
  }

  protected static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<{ result: T; error: NextResponse | null }> {
    try {
      const result = await operation()
      return { result, error: null }
    } catch (error: any) {
      console.error(`${errorMessage}:`, error)
      
      // Handle known error types
      if (error.message?.includes('duplicate key value') || error.code === '23505') {
        return {
          result: null as any,
          error: this.createErrorResponse(
            'Resource already exists',
            'DUPLICATE_RESOURCE',
            409
          ),
        }
      }
      
      if (error.message?.includes('foreign key') || error.code === '23503') {
        return {
          result: null as any,
          error: this.createErrorResponse(
            'Referenced resource not found',
            'FOREIGN_KEY_ERROR',
            400
          ),
        }
      }
      
      if (error.message?.includes('Cannot delete') || error.message?.includes('has associated')) {
        return {
          result: null as any,
          error: this.createErrorResponse(
            error.message,
            'DELETE_CONSTRAINT',
            409
          ),
        }
      }

      return {
        result: null as any,
        error: this.createErrorResponse(
          error.message || errorMessage,
          'OPERATION_FAILED',
          500
        ),
      }
    }
  }
}