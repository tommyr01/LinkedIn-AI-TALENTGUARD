'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown,
  ChevronUp,
  Brain,
  Eye,
  LinkedinIcon,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { ArticlesView } from './articles-view'
import { format } from 'date-fns'

interface Connection {
  id: string
  full_name: string
  current_company?: string
  title?: string
  headline?: string
  username?: string
}

interface IntelligenceProfile {
  connectionId: string
  connectionName: string
  company: string
  title: string
  profileUrl?: string
  linkedInAnalysis?: {
    articles_analysis?: Array<{
      title: string
      url?: string
      content: string
      publishedDate: string
      engagement: {
        likes: number
        comments: number
        shares: number
      }
    }>
  }
  webResearch?: {
    articles_found?: Array<{
      title: string
      url?: string
      content: string
      publishedDate: string
      source: string
      relevanceScore?: number
    }>
  }
  unifiedScores: {
    overallExpertise: number
    talentManagement: number
    peopleDevelopment: number
    hrTechnology: number
    practicalExperience?: number
    thoughtLeadership?: number
  }
  intelligenceAssessment: {
    verificationStatus: 'verified' | 'likely' | 'unverified'
    confidenceLevel: number
    strengths: string[]
    recommendations: string[]
    redFlags: string[]
  }
  researchDuration: number
  researched_at: string
}

interface IntelligenceCardProps {
  connection: Connection
  profile?: IntelligenceProfile | null
  isSelected: boolean
  onToggleSelection: (connectionId: string) => void
  onResearch: (connectionId: string) => Promise<void>
  isLoading?: boolean
}

export function IntelligenceCard({
  connection,
  profile,
  isSelected,
  onToggleSelection,
  onResearch,
  isLoading = false
}: IntelligenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingFullProfile, setIsLoadingFullProfile] = useState(false)
  const [fullProfile, setFullProfile] = useState<IntelligenceProfile | null>(null)
  const [isReResearching, setIsReResearching] = useState(false)

  const handleExpandToggle = async () => {
    console.log('🔍 handleExpandToggle called:', { 
      isExpanded, 
      hasProfile: !!profile, 
      hasFullProfile: !!fullProfile,
      connectionId: connection.id 
    })
    
    if (!isExpanded && profile && !fullProfile) {
      // Fetch full profile data when expanding for the first time
      setIsLoadingFullProfile(true)
      try {
        console.log(`📡 Fetching full profile for connection: ${connection.id}`)
        const response = await fetch(`/api/intelligence/profiles?connectionId=${connection.id}`)
        console.log('📡 API Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📡 API Response data:', data)
          
          if (data.success && data.data?.profile) {
            setFullProfile(data.data.profile)
            console.log('✅ Full profile loaded successfully')
          } else {
            console.log('❌ No profile data in response:', data.error || 'Unknown error')
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.error('❌ API response not OK:', response.status, errorText)
        }
      } catch (error) {
        console.error('❌ Error loading full profile:', error)
        // Don't prevent expansion if profile loading fails - user can still see basic info
      } finally {
        setIsLoadingFullProfile(false)
      }
    }
    
    const newExpandedState = !isExpanded
    console.log('🔄 Setting isExpanded to:', newExpandedState)
    setIsExpanded(newExpandedState)
  }

  const handleReResearch = async () => {
    // Prevent multiple simultaneous re-research operations
    if (isReResearching || isLoading) {
      console.log('⚠️ Re-research already in progress, ignoring request')
      return
    }

    setIsReResearching(true)
    
    try {
      console.log(`🔄 Starting re-research for ${connection.full_name}`)
      await onResearch(connection.id)
      
      // If expanded, refresh the full profile data
      if (isExpanded) {
        console.log('🔄 Refreshing expanded profile after re-research')
        
        // Clear current full profile and reload
        setFullProfile(null)
        
        // Use a proper async delay instead of setTimeout with async callback
        await new Promise(resolve => setTimeout(resolve, 200))
        
        try {
          // Manually trigger profile reload by fetching fresh data
          console.log(`📡 Fetching updated profile for connection: ${connection.id}`)
          const response = await fetch(`/api/intelligence/profiles?connectionId=${connection.id}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('📡 Updated profile response:', data)
            
            if (data.success && data.data?.profile) {
              setFullProfile(data.data.profile)
              console.log('✅ Updated profile loaded successfully')
            } else {
              console.log('❌ No updated profile data available:', data.error || 'No profile found')
              // Keep expanded but with no full profile - will show basic data
            }
          } else {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.error('❌ Failed to fetch updated profile:', response.status, errorText)
            // Keep expanded but with no full profile
          }
        } catch (profileError) {
          console.error('❌ Error fetching updated profile:', profileError)
          // Don't collapse on profile fetch error - user can still see basic info
        }
      }
      
      console.log(`✅ Re-research completed successfully for ${connection.full_name}`)
    } catch (error) {
      console.error(`❌ Error during re-research for ${connection.full_name}:`, error)
      // The onResearch function already shows error toasts, so we don't need to show another one
    } finally {
      setIsReResearching(false)
    }
  }

  const getVerificationBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default'
      case 'likely': return 'secondary'
      case 'unverified': return 'outline'
      default: return 'outline'
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-3 w-3" />
      case 'likely': return <TrendingUp className="h-3 w-3" />
      case 'unverified': return <AlertTriangle className="h-3 w-3" />
      default: return null
    }
  }

  const getExpertiseColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-gray-500'
  }

  // Safely compute display profile with validation
  const displayProfile = (() => {
    const candidate = fullProfile || profile
    
    // Validate the profile has required structure
    if (!candidate) return null
    
    // Ensure critical fields exist to prevent render errors
    try {
      if (typeof candidate.connectionId !== 'string' || 
          typeof candidate.connectionName !== 'string') {
        console.warn('⚠️ Invalid profile structure detected:', candidate)
        return null
      }
      return candidate
    } catch (error) {
      console.error('❌ Error validating profile structure:', error)
      return null
    }
  })()

  console.log('🎨 IntelligenceCard render:', {
    connectionName: connection.full_name,
    isExpanded,
    hasDisplayProfile: !!displayProfile,
    hasFullProfile: !!fullProfile,
    hasProfile: !!profile
  })

  // Additional logging for expanded content
  if (isExpanded && displayProfile) {
    console.log('🔍 Rendering expanded content for:', connection.full_name)
  }
  if (isExpanded && !displayProfile) {
    console.log('⚠️ Expanded but no displayProfile for:', connection.full_name)
  }

  return (
    <Card className={`transition-all duration-200 ${
      isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    } ${isExpanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(connection.id)}
                className="rounded border-gray-300"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{connection.full_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {connection.title} {connection.current_company && `at ${connection.current_company}`}
                </p>
                {connection.username && (
                  <div className="flex items-center mt-1">
                    <LinkedinIcon className="h-3 w-3 mr-1 text-blue-600" />
                    <span className="text-xs text-muted-foreground">
                      linkedin.com/in/{connection.username}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {profile && !isExpanded && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Researched
                  </Badge>
                  
                  {/* Show article count if available */}
                  {(() => {
                    try {
                      const linkedInArticles = profile?.linkedInAnalysis?.articles_analysis?.length || 0
                      const webArticles = profile?.webResearch?.articles_found?.length || 0
                      const totalArticles = linkedInArticles + webArticles
                      
                      if (totalArticles > 0) {
                        return (
                          <Badge variant="secondary">
                            {totalArticles} article{totalArticles !== 1 ? 's' : ''} found
                          </Badge>
                        )
                      }
                    } catch (error) {
                      console.error('❌ Error computing article count:', error)
                    }
                    return null
                  })()}
                </div>
                
                {/* Show topics they write about */}
                {(() => {
                  try {
                    const allContent = [
                      ...(profile?.linkedInAnalysis?.articles_analysis || []).map(a => a?.content || ''),
                      ...(profile?.webResearch?.articles_found || []).map(a => a?.content || '')
                    ].join(' ').toLowerCase()
                    
                    const topics = []
                    if (allContent.includes('talent management')) topics.push('Talent Management')
                    if (allContent.includes('people development')) topics.push('People Development')
                    if (allContent.includes('leadership')) topics.push('Leadership')
                    if (allContent.includes('hr') || allContent.includes('human resources')) topics.push('HR')
                    
                    if (topics.length > 0) {
                      return (
                        <div className="text-xs text-muted-foreground">
                          <strong>Writes about:</strong> {topics.slice(0, 3).join(', ')}
                          {topics.length > 3 && '...'}
                        </div>
                      )
                    }
                  } catch (error) {
                    console.error('❌ Error computing content topics:', error)
                  }
                  return null
                })()}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end space-y-2">
            {profile ? (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExpandToggle}
                  disabled={isLoadingFullProfile}
                >
                  {isLoadingFullProfile ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {isExpanded ? (
                        <>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Hide Articles
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          View Articles
                        </>
                      )}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReResearch}
                  disabled={isLoading || isReResearching}
                  title="Re-run research"
                >
                  <RefreshCw className={`h-4 w-4 ${isReResearching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                onClick={() => onResearch(connection.id)}
                disabled={isLoading}
              >
                <Brain className="mr-2 h-4 w-4" />
                Research
              </Button>
            )}
            
            {profile && (
              <div className="text-right text-xs text-muted-foreground">
                <div>Researched {format(new Date(profile.researched_at), 'MMM d, yyyy')}</div>
                <div>{profile.researchDuration}s duration</div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && displayProfile && (
        <CardContent className="pt-0">
          <ArticlesView 
            profile={displayProfile}
            connection={connection}
          />
        </CardContent>
      )}
      {isExpanded && !displayProfile && (
        <CardContent className="pt-0">
          <div className="text-center py-4">No profile data available</div>
        </CardContent>
      )}
    </Card>
  )
}