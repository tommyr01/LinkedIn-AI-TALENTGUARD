"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  const [apiResults, setApiResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (endpoint: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/${endpoint}`)
      const data = await response.json()
      setApiResults(prev => ({
        ...prev,
        [endpoint]: {
          success: response.ok,
          data: Array.isArray(data) ? data.slice(0, 2) : data, // Show first 2 records only
          count: Array.isArray(data) ? data.length : 1,
          error: response.ok ? null : data.error || 'Unknown error'
        }
      }))
    } catch (error) {
      setApiResults(prev => ({
        ...prev,
        [endpoint]: {
          success: false,
          error: (error as Error).message,
          data: null,
          count: 0
        }
      }))
    }
    setLoading(false)
  }

  const testAllEndpoints = async () => {
    await Promise.all([
      testEndpoint('accounts'),
      testEndpoint('contacts'),
      testEndpoint('signals'),
      testEndpoint('reports')
    ])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Airtable Integration Test</h1>
        <Button onClick={testAllEndpoints} disabled={loading}>
          {loading ? 'Testing...' : 'Test All Endpoints'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(apiResults).map(([endpoint, result]: [string, any]) => (
          <Card key={endpoint}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                /api/{endpoint}
                <span className={`text-sm px-2 py-1 rounded ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? '✓ Success' : '✗ Error'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Found {result.count} records
                  </p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-red-600 text-sm">
                  Error: {result.error}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(apiResults).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Click "Test All Endpoints" to verify your Airtable integration
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 