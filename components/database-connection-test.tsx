"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Copy, Database, Users, FileText, Calendar, Target, MessageSquare, Award, BarChart3, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TableStatus {
  name: string
  connected: boolean
  count?: number
  error?: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export function DatabaseConnectionTest() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [allErrors, setAllErrors] = useState<string[]>([])

  const tables: Omit<TableStatus, 'connected' | 'count' | 'error'>[] = [
    { name: 'users', icon: Users, description: 'User accounts and roles' },
    { name: 'profiles', icon: Users, description: 'Supabase auth profiles' },
    { name: 'initiatives', icon: Target, description: 'Strategic initiatives and projects' },
    { name: 'notes', icon: MessageSquare, description: 'Initiative notes and updates' },
    { name: 'achievements', icon: Award, description: 'Milestones and achievements' },
    { name: 'executive_summaries', icon: BarChart3, description: 'Executive summary reports' },
    { name: 'navigation_settings', icon: Settings, description: 'Navigation configuration' }
  ]

  const testConnection = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const errors: string[] = []
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }

      const results = await Promise.all(
        tables.map(async (table) => {
          try {
            const { data, error, count } = await supabase
              .from(table.name)
              .select('*', { count: 'exact', head: true })

            if (error) {
              errors.push(`${table.name}: ${error.message}`)
              return {
                ...table,
                connected: false,
                error: error.message
              }
            }

            return {
              ...table,
              connected: true,
              count: count || 0
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            errors.push(`${table.name}: ${errorMsg}`)
            return {
              ...table,
              connected: false,
              error: errorMsg
            }
          }
        })
      )

      setTableStatuses(results)
      setAllErrors(errors)
    } catch (error) {
      console.error('Connection test failed:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`General error: ${errorMsg}`)
      setAllErrors(errors)
    } finally {
      setIsLoading(false)
    }
  }

  const copyErrors = () => {
    const errorText = allErrors.join('\n')
    navigator.clipboard.writeText(errorText)
  }

  const copySuccessInfo = () => {
    const connectedTables = tableStatuses.filter(t => t.connected)
    const successText = `✅ DATABASE CONNECTION SUCCESS\n\nConnected Tables (${connectedTables.length}/${tableStatuses.length}):\n${connectedTables.map(t => `• ${t.name}: ${t.count} records`).join('\n')}\n\nUser: ${userEmail}\nTimestamp: ${new Date().toISOString()}`
    navigator.clipboard.writeText(successText)
  }

  useEffect(() => {
    testConnection()
  }, [])

  const connectedCount = tableStatuses.filter(t => t.connected).length
  const totalCount = tableStatuses.length
  const allConnected = connectedCount === totalCount && totalCount > 0
  const hasErrors = allErrors.length > 0

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Database Connection Test</h1>
        <p className="text-muted-foreground">
          Testing connections to all Supabase tables
        </p>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={testConnection} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Testing Connection...' : 'Retest Connection'}
        </Button>
      </div>

      {/* Overall Status */}
      {tableStatuses.length > 0 && (
        <Alert className={allConnected ? 'border-green-200 bg-green-50' : hasErrors ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
          <div className="flex items-center gap-2">
            {allConnected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : hasErrors ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className="flex-1">
              <strong>
                {allConnected 
                  ? '🎉 All systems connected!' 
                  : hasErrors 
                    ? '❌ Connection issues detected' 
                    : '⚠️ Partial connection'
                }
              </strong>
              {' '}
              ({connectedCount}/{totalCount} tables connected)
              {userEmail && (
                <span className="ml-2 text-sm">
                  • User: <code className="bg-white px-1 rounded">{userEmail}</code>
                </span>
              )}
            </AlertDescription>
            {allConnected && (
              <Button size="sm" variant="outline" onClick={copySuccessInfo}>
                <Copy className="w-3 h-3 mr-1" />
                Copy Success Info
              </Button>
            )}
          </div>
        </Alert>
      )}

      {/* Error Messages Section */}
      {hasErrors && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">Connection Errors</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={copyErrors}>
                <Copy className="w-3 h-3 mr-1" />
                Copy Errors
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allErrors.map((error, index) => (
                <div key={index} className="text-sm font-mono bg-red-50 p-2 rounded border border-red-200">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tableStatuses.map((table) => {
          const IconComponent = table.icon
          return (
            <Card key={table.name} className={`transition-colors ${
              table.connected 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <CardTitle className="text-sm font-medium">{table.name}</CardTitle>
                  </div>
                  {table.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <CardDescription className="text-xs">
                  {table.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {table.connected ? (
                  <Badge variant="secondary" className="text-xs">
                    {table.count} records
                  </Badge>
                ) : (
                  <div className="text-xs text-red-600 font-mono bg-red-100 p-1 rounded">
                    {table.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Success Actions */}
      {allConnected && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              🎉 Database Ready!
            </CardTitle>
            <CardDescription>
              All tables are connected and populated with data. Your dashboard is ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                View Dashboard
              </Button>
              <Button size="sm" variant="outline">
                Manage Users
              </Button>
              <Button size="sm" variant="outline">
                Create Initiative
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />
      
      <div className="text-center text-sm text-muted-foreground">
        <p>This test verifies your Supabase connection and table accessibility.</p>
        <p>All tables should show as connected with record counts for full functionality.</p>
      </div>
    </div>
  )
}
