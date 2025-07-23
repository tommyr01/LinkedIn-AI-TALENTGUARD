"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconSearch, IconCalendar, IconExternalLink, IconAlertCircle, IconTarget, IconMessageCircle } from '@tabler/icons-react'

// Type definition for API signal data based on actual Airtable structure
interface Signal {
  id: string
  SourceURL: string
  Date: string
  Type: string
  Summary: string
  LinkedContact: string[]
  LinkedAccount: string[]
  DaysSinceSignal: number
  SignalImpact: {
    state: string
    value: string
    isStale: boolean
  }
  SignalSentiment: {
    state: string
    value: string
    isStale: boolean
  }
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
})

// Signal type color mapping
const signalTypeColors = {
  'News': 'bg-blue-100 text-blue-800 border-blue-200',
  'LinkedIn Post': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Job Change': 'bg-teal-100 text-teal-800 border-teal-200',
  'Funding': 'bg-green-100 text-green-800 border-green-200',
  'Other': 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export default function SignalsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: signals, isLoading, error } = useSWR<Signal[]>('/api/signals', fetcher)

  // Filter signals based on search
  const filteredSignals = signals?.filter((s: Signal) => 
    s.SourceURL?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.Type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.Summary?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading signals...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load signals</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Signals</h1>
        <p className="text-muted-foreground">
          Analyze and act on key market signals
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search signals by source, type, or summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSignals.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">No signals found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          </div>
        ) : (
          filteredSignals.map((signal: Signal) => (
            <Card key={signal.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {signal.SourceURL || 'Unnamed Signal'}
                      <Badge 
                        variant="outline" 
                        className={signalTypeColors[signal.Type as keyof typeof signalTypeColors] || signalTypeColors.Other}
                      >
                        {signal.Type || 'Unknown'}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">{signal.Date || 'No date'}</span>
                      {signal.SourceURL && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={() => window.open(signal.SourceURL, '_blank')}
                        >
                          <IconExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {signal.DaysSinceSignal || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Days Since Signal</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Signal Stats */}
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span>{signal.Date || 'No date'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{signal.Summary || 'No summary'}</span>
                  </div>
                </div>

                {/* AI-Generated Signal Impact */}
                {signal.SignalImpact?.value && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconTarget className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Signal Impact</p>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                      {signal.SignalImpact.value}
                    </p>
                  </div>
                )}

                {/* AI-Generated Signal Sentiment */}
                {signal.SignalSentiment?.value && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <IconMessageCircle className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Signal Sentiment</p>
                    </div>
                    <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-md">
                      {signal.SignalSentiment.value}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}