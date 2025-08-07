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
import { IntelligenceReportDisplay } from './intelligence-report-display'
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
    if (!isExpanded && profile && !fullProfile) {
      // Fetch full profile data when expanding for the first time
      setIsLoadingFullProfile(true)
      try {
        const response = await fetch(`/api/intelligence/profiles?connectionId=${connection.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data.profile) {
            setFullProfile(data.data.profile)
          }
        }
      } catch (error) {
        console.error('Error loading full profile:', error)
      } finally {
        setIsLoadingFullProfile(false)
      }
    }
    setIsExpanded(!isExpanded)
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
                  <Badge variant={getVerificationBadgeVariant(profile.intelligenceAssessment.verificationStatus)}>
                    {getVerificationIcon(profile.intelligenceAssessment.verificationStatus)}
                    <span className="ml-1">{profile.intelligenceAssessment.verificationStatus}</span>
                  </Badge>
                  <span className={`text-sm font-medium ${getExpertiseColor(profile.unifiedScores.overallExpertise)}`}>
                    {profile.unifiedScores.overallExpertise}/100 Overall
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {profile.intelligenceAssessment.confidenceLevel}% confidence
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <span>Talent Mgmt: <strong className={getExpertiseColor(profile.unifiedScores.talentManagement)}>{profile.unifiedScores.talentManagement}</strong></span>
                  <span>People Dev: <strong className={getExpertiseColor(profile.unifiedScores.peopleDevelopment)}>{profile.unifiedScores.peopleDevelopment}</strong></span>
                  <span>HR Tech: <strong className={getExpertiseColor(profile.unifiedScores.hrTechnology)}>{profile.unifiedScores.hrTechnology}</strong></span>
                  <span>Leadership: <strong className={getExpertiseColor(profile.unifiedScores.thoughtLeadership || 0)}>{profile.unifiedScores.thoughtLeadership || 0}</strong></span>
                </div>

                {profile.intelligenceAssessment.strengths.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <strong>Key Strengths:</strong> {profile.intelligenceAssessment.strengths.slice(0, 2).join(', ')}
                    {profile.intelligenceAssessment.strengths.length > 2 && '...'}
                  </div>
                )}
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
                          Collapse
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
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
          <IntelligenceReportDisplay 
            profile={displayProfile}
            connection={connection}
          />
        </CardContent>
      )}
    </Card>
  )
}