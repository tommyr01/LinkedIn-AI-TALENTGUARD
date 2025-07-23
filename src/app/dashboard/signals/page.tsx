"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconSearch, IconCalendar, IconTarget, IconTrendingUp, IconExternalLink, IconBrain, IconMoodHappy, IconMoodSad, IconMoodEmpty, IconNews, IconBrandLinkedin, IconBriefcase, IconCurrencyDollar } from '@tabler/icons-react'

// Type definition for API signal data based on actual Airtable structure
interface Signal {
  id: string
  sourceUrl: string
  date: string
  type: string
  summary: string
  linkedContact: string[]
  linkedAccount: string[]
  daysSinceSignal: number
  signalImpact: {
    state: string
    value: string
    isStale: boolean
  }
  signalSentiment: {
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

// Signal type icons
const signalTypeIcons = {
  'News': IconNews,
  'LinkedIn Post': IconBrandLinkedin,
  'Job Change': IconBriefcase,
  'Funding': IconCurrencyDollar,
  'Other': IconTarget
}

// Sentiment color mapping
const sentimentColors = {
  'Positive': 'text-green-600',
  'Neutral': 'text-gray-600',
  'Negative': 'text-red-600'
}

// Sentiment icons
const sentimentIcons = {
  'Positive': IconMoodHappy,
  'Neutral': IconMoodEmpty,
  'Negative': IconMoodSad
}

// Get recency color based on days since signal
const getRecencyColor = (days: number) => {
  if (days <= 7) return 'text-green-600'
  if (days <= 30) return 'text-yellow-600'
  return 'text-red-600'
}

// Format days since signal
const formatDaysSince = (days: number) => {
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days <= 7) return `${days} days ago`
  if (days <= 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

export default function SignalsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: signals, isLoading, error } = useSWR<Signal[]>('/api/signals', fetcher)

  // Stats calculations
  const totalSignals = signals?.length || 0
  const recentSignals = signals?.filter((s: Signal) => s.daysSinceSignal <= 7).length || 0
  const positiveSignals = signals?.filter((s: Signal) => 
    s.signalSentiment?.value?.toLowerCase() === 'positive'
  ).length || 0
  const avgDaysOld = Math.round((signals?.reduce((acc: number, curr: Signal) => acc + (curr.daysSinceSignal || 0), 0) || 0) / (totalSignals || 1))

  // Filter signals based on search
  const filteredSignals = signals?.filter((s: Signal) => 
    s.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sourceUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.signalImpact?.value?.toLowerCase().includes(searchQuery.toLowerCase())
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
          Track and analyze market signals and engagement activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconTarget className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Signals</p>
                <p className="text-2xl font-bold">{totalSignals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Recent (7 days)</p>
                <p className="text-2xl font-bold text-green-600">{recentSignals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Positive Signals</p>
                <p className="text-2xl font-bold text-green-600">{positiveSignals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Avg Age (days)</p>
                <p className={`text-2xl font-bold ${getRecencyColor(avgDaysOld)}`}>{avgDaysOld}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search signals by type, content, or impact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSignals.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">No signals found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          </div>
        ) : (
          filteredSignals.map((signal: Signal) => {
            const SignalIcon = signalTypeIcons[signal.type as keyof typeof signalTypeIcons] || IconTarget
            const SentimentIcon = sentimentIcons[signal.signalSentiment?.value as keyof typeof sentimentIcons] || IconMoodEmpty
            
            return (
              <Card key={signal.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <SignalIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={signalTypeColors[signal.type as keyof typeof signalTypeColors] || signalTypeColors.Other}
                          >
                            {signal.type || 'Other'}
                          </Badge>
                          {signal.signalSentiment?.value && (
                            <div className="flex items-center gap-1">
                              <SentimentIcon className={`h-4 w-4 ${sentimentColors[signal.signalSentiment.value as keyof typeof sentimentColors] || 'text-gray-600'}`} />
                              <span className={`text-xs ${sentimentColors[signal.signalSentiment.value as keyof typeof sentimentColors] || 'text-gray-600'}`}>
                                {signal.signalSentiment.value}
                              </span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-sm mt-1">
                          {signal.date || 'No date'}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getRecencyColor(signal.daysSinceSignal)}`}>
                        {formatDaysSince(signal.daysSinceSignal)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {signal.daysSinceSignal} days ago
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Signal Summary */}
                  {signal.summary && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">
                        {signal.summary}
                      </p>
                    </div>
                  )}

                  {/* AI-Generated Impact Analysis */}
                  {signal.signalImpact?.value && (
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <IconBrain className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">Impact Analysis</p>
                      </div>
                      <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md">
                        {signal.signalImpact.value}
                      </p>
                    </div>
                  )}

                  {/* Source URL */}
                  {signal.sourceUrl && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">Source:</p>
                        <p className="text-xs text-gray-700 truncate max-w-xs">
                          {signal.sourceUrl}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => window.open(signal.sourceUrl, '_blank')}
                      >
                        <IconExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Linked Entities */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <IconTarget className="h-3 w-3" />
                      <span>{signal.linkedContact?.length || 0} contacts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconTarget className="h-3 w-3" />
                      <span>{signal.linkedAccount?.length || 0} accounts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}