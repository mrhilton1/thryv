'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TableStatus {
  name: string
  status: 'checking' | 'connected' | 'error'
  count?: number
  error?: string
}

export default function DatabaseTestComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [error, setError] = useState<string | null>(null)

  const tables = [
    'users',
    'initiatives', 
    'notes',
    'achievements',
    'executive_summaries',
    'navigation_settings'
  ]

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus('testing')
    setError(null)
    
    // Initialize table statuses
    const initialStatuses: TableStatus[] = tables.map(table => ({
      name: table,
      status: 'checking'
    }))
    setTableStatuses(initialStatuses)

    try {
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.')
      }

      const supabase = createClient()
      const updatedStatuses: TableStatus[] = []

      // Test each table
      for (const tableName of tables) {
        try {
          const { data, error: tableError, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          if (tableError) {
            updatedStatuses.push({
              name: tableName,
              status: 'error',
              error: tableError.message
            })
          } else {
            updatedStatuses.push({
              name: tableName,
              status: 'connected',
              count: count || 0
            })
          }
        } catch (err) {
          updatedStatuses.push({
            name: tableName,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }

        // Update status incrementally
        setTableStatuses([...updatedStatuses])
      }

      // Check if all tables are connected
      const allConnected = updatedStatuses.every(status => status.status === 'connected')
      setConnectionStatus(allConnected ? 'success' : 'error')

      if (!allConnected) {
        const errorTables = updatedStatuses.filter(s => s.status === 'error')
        setError(`Failed to connect to ${errorTables.length} table(s): ${errorTables.map(t => t.name).join(', ')}`)
      }

    } catch (err) {
      setConnectionStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown connection error')
      
      // Mark all tables as error
      setTableStatuses(tables.map(table => ({
        name: table,
        status: 'error',
        error: 'Connection failed'
      })))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: TableStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TableStatus['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Database Connection Test
          </h1>
        </div>
        <p className="text-gray-600">
          Test your Supabase database connection and verify all tables are properly set up
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Click the button below to test your database connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectionStatus === 'testing' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              {connectionStatus === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {connectionStatus === 'error' && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">
                {connectionStatus === 'idle' && 'Ready to test'}
                {connectionStatus === 'testing' && 'Testing connection...'}
                {connectionStatus === 'success' && 'All tables connected successfully!'}
                {connectionStatus === 'error' && 'Connection failed'}
              </span>
            </div>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {tableStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>
              Status of each table in your Executive Dashboard database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tableStatuses.map((table) => (
                <div 
                  key={table.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(table.status)}
                    <div>
                      <h3 className="font-medium capitalize">
                        {table.name.replace('_', ' ')}
                      </h3>
                      {table.error && (
                        <p className="text-sm text-red-600 mt-1">{table.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {table.count !== undefined && (
                      <span className="text-sm text-gray-500">
                        {table.count} records
                      </span>
                    )}
                    {getStatusBadge(table.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Make sure you've run the SQL schema in your Supabase SQL Editor</li>
          <li>2. Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables</li>
          <li>3. Click "Test Connection" to verify everything is working</li>
          <li>4. Once all tables show "Connected", you're ready to use the dashboard!</li>
        </ul>
      </div>
    </div>
  )
}
