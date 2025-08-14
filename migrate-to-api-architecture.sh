#!/bin/bash

# API Architecture Migration Script
# This script recreates the complete API layer refactoring

echo "🚀 Starting API Architecture Migration..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p lib/api/repositories
mkdir -p app/api/{users,initiatives,achievements,config}/{[id],reorder}
mkdir -p app/api/config/{items,navigation,field-configurations,field-mappings}/{[id],reorder}
mkdir -p app/api/health

echo "✅ Directory structure created"

# Base Controller
echo "📝 Creating base controller..."
cat > lib/api/base-controller.ts << 'EOF'
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
EOF

echo "✅ Base controller created"

# DTOs
echo "📝 Creating DTOs..."
cat > lib/api/dto.ts << 'EOF'
import { z } from 'zod'

// User DTOs
export const CreateUserDto = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "executive", "manager", "user"]),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const UpdateUserDto = CreateUserDto.partial()

export type CreateUserRequest = z.infer<typeof CreateUserDto>
export type UpdateUserRequest = z.infer<typeof UpdateUserDto>

// Initiative DTOs
export const CreateInitiativeDto = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required"),
  goal: z.string().optional(),
  productArea: z.string().min(1, "Product area is required"),
  team: z.string().min(1, "Team is required"),
  tier: z.number().min(1).max(3).default(1),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["On Track", "At Risk", "Off Track", "Complete", "Cancelled", "Paused", "Blocked", "Deprioritized"]),
  progress: z.number().min(0).max(100).default(0),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  ownerId: z.string().min(1, "Owner is required"),
  createdById: z.string().min(1, "Creator is required"),
  // Optional fields for additional details
  businessImpact: z.string().optional(),
  processStage: z.string().optional(),
  gtmType: z.string().optional(),
})

export const UpdateInitiativeDto = CreateInitiativeDto.partial()

export type CreateInitiativeRequest = z.infer<typeof CreateInitiativeDto>
export type UpdateInitiativeRequest = z.infer<typeof UpdateInitiativeDto>

// Achievement DTOs
export const CreateAchievementDto = z.object({
  initiativeId: z.string().min(1, "Initiative ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["achievement", "milestone"]),
  dateAchieved: z.string().or(z.date()),
  createdById: z.string().min(1, "Creator is required"),
})

export const UpdateAchievementDto = CreateAchievementDto.partial().omit({ initiativeId: true })

export type CreateAchievementRequest = z.infer<typeof CreateAchievementDto>
export type UpdateAchievementRequest = z.infer<typeof UpdateAchievementDto>

// Navigation Config DTOs
export const CreateNavigationConfigDto = z.object({
  itemKey: z.string().min(1, "Item key is required"),
  itemLabel: z.string().min(1, "Item label is required"),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

export const UpdateNavigationConfigDto = CreateNavigationConfigDto.partial()

export type CreateNavigationConfigRequest = z.infer<typeof CreateNavigationConfigDto>
export type UpdateNavigationConfigRequest = z.infer<typeof UpdateNavigationConfigDto>

// Config Item DTOs
export const CreateConfigItemDto = z.object({
  category: z.enum([
    "teams",
    "business_impacts", 
    "product_areas",
    "process_stages",
    "priorities",
    "statuses",
    "gtm_types",
  ]),
  label: z.string().min(1, "Label is required"),
  color: z.enum(["gray", "red", "orange", "yellow", "green", "blue", "purple", "pink"]).default("gray"),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  createdById: z.string().optional(),
})

export const UpdateConfigItemDto = CreateConfigItemDto.partial().omit({ category: true })

export type CreateConfigItemRequest = z.infer<typeof CreateConfigItemDto>
export type UpdateConfigItemRequest = z.infer<typeof UpdateConfigItemDto>

// Field Configuration DTOs
export const UpdateFieldConfigurationDto = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  isRequired: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().optional(),
  fieldType: z.string().optional(),
  options: z.array(z.string()).optional(),
})

export type UpdateFieldConfigurationRequest = z.infer<typeof UpdateFieldConfigurationDto>

// Reorder DTOs
export const ReorderItemsDto = z.array(
  z.object({
    id: z.string(),
    sortOrder: z.number(),
  })
)

export type ReorderItemsRequest = z.infer<typeof ReorderItemsDto>

// Field mappings DTOs
export const CreateFieldMappingDto = z.object({
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
  transformation: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const UpdateFieldMappingDto = CreateFieldMappingDto.partial()

export type CreateFieldMappingRequest = z.infer<typeof CreateFieldMappingDto>
export type UpdateFieldMappingRequest = z.infer<typeof UpdateFieldMappingDto>
EOF

echo "✅ DTOs created"

# Health check endpoint
cat > app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      initiatives: '/api/initiatives',
      achievements: '/api/achievements',
      config: {
        items: '/api/config/items',
        navigation: '/api/config/navigation',
        fieldConfigurations: '/api/config/field-configurations',
        fieldMappings: '/api/config/field-mappings'
      }
    }
  })
}
EOF

echo "✅ Health check endpoint created"

echo "🎯 Core API structure created!"
echo ""
echo "📋 Next steps:"
echo "1. Run this script in your local repository root"
echo "2. Copy the remaining repository and endpoint files (I'll provide those next)"
echo "3. Update your component imports from 'supabase-database-context' to 'api-database-context'"
echo "4. Test the API endpoints"
echo ""
echo "🔗 Test your API: curl http://localhost:3000/api/health"
EOF

chmod +x migrate-to-api-architecture.sh

echo "✅ Migration script created!"

<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">ls -la migrate-to-api-architecture.sh
</parameter>
</invoke>
</function_calls>