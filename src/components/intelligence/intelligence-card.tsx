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
  webResearch?: any
  linkedInAnalysis?: any
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
          
          if (data.success && data.data.profile) {
            setFullProfile(data.data.profile)
            console.log('✅ Full profile loaded successfully')
          } else {
            console.log('❌ No profile data in response')
          }
        } else {
          console.log('❌ API response not OK:', response.status)
        }
      } catch (error) {
        console.error('❌ Error loading full profile:', error)
      } finally {
        setIsLoadingFullProfile(false)
      }
    }
    
    const newExpandedState = !isExpanded
    console.log('🔄 Setting isExpanded to:', newExpandedState)
    setIsExpanded(newExpandedState)
  }

  const handleReResearch = async () => {
    await onResearch(connection.id)
    // Refresh full profile after re-research
    if (isExpanded) {
      setFullProfile(null)
      handleExpandToggle()
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

  const displayProfile = fullProfile || profile

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
                    const linkedInArticles = profile.linkedInAnalysis?.articles_analysis?.length || 0
                    const webArticles = profile.webResearch?.articles_found?.length || 0
                    const totalArticles = linkedInArticles + webArticles
                    
                    if (totalArticles > 0) {
                      return (
                        <Badge variant="secondary">
                          {totalArticles} article{totalArticles !== 1 ? 's' : ''} found
                        </Badge>
                      )
                    }
                    return null
                  })()}
                </div>
                
                {/* Show topics they write about */}
                {(() => {
                  const allContent = [
                    ...(profile.linkedInAnalysis?.articles_analysis || []).map(a => a.content),
                    ...(profile.webResearch?.articles_found || []).map(a => a.content)
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
                  disabled={isLoading}
                  title="Re-run research"
                >
                  <RefreshCw className="h-4 w-4" />
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