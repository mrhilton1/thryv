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