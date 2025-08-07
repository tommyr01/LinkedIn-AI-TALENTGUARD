'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Brain, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Filter,
  Download,
  Play,
  Pause,
  BarChart3,
  Globe,
  LinkedinIcon,
  Eye,
  Star
} from 'lucide-react'
import { toast } from "sonner"

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
  unifiedScores: {
    overallExpertise: number
    talentManagement: number
    peopleDevelopment: number
    hrTechnology: number
    practicalExperience: number
    thoughtLeadership: number
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

export default function IntelligenceDashboard() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [intelligenceProfiles, setIntelligenceProfiles] = useState<IntelligenceProfile[]>([])
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'high_value' | 'verified' | 'unresearched'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isBatchProcessing, setBatchProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 })

  // Load connections on mount
  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Loading LinkedIn connections...')
      
      const response = await fetch('/api/intelligence/connections?limit=200', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setConnections(data.data.connections)
        console.log(`✅ Loaded ${data.data.connections.length} connections`)
        toast.success(`Loaded ${data.data.connections.length} LinkedIn connections`)
      } else {
        throw new Error(data.error || 'Failed to load connections')
      }
      
    } catch (error: any) {
      console.error('Error loading connections:', error)
      toast.error(`Failed to load connections: ${error.message}`)
      
      // Fallback to empty array on error
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }

  const researchSingleConnection = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId)
    if (!connection) return

    setIsLoading(true)
    try {
      console.log(`🔍 Starting intelligence research for ${connection.full_name}`)
      toast.info(`Starting intelligence research for ${connection.full_name}...`)

      const response = await fetch('/api/intelligence/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        const profile: IntelligenceProfile = data.data.profile
        
        // Add to intelligence profiles
        setIntelligenceProfiles(prev => {
          const existing = prev.findIndex(p => p.connectionId === connectionId)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = profile
            return updated
          } else {
            return [...prev, profile]
          }
        })

        toast.success(`Intelligence research completed for ${connection.full_name}`, {
          description: `Overall expertise: ${profile.unifiedScores.overallExpertise}/100 (${profile.intelligenceAssessment.verificationStatus})`
        })
      } else {
        throw new Error(data.error || 'Research failed')
      }

    } catch (error: any) {
      console.error(`Error researching ${connection.full_name}:`, error)
      toast.error(`Failed to research ${connection.full_name}: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const startBatchResearch = async () => {
    if (selectedConnections.length === 0) {
      toast.error('Please select connections to research')
      return
    }

    setBatchProcessing(true)
    setBatchProgress({ completed: 0, total: selectedConnections.length })
    
    try {
      console.log(`🔄 Starting batch research for ${selectedConnections.length} connections`)
      toast.info(`Starting batch intelligence research for ${selectedConnections.length} connections...`)

      const response = await fetch('/api/intelligence/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionIds: selectedConnections,
          priorityOrder: 'expertise_potential',
          maxConcurrency: 2
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        const batchResult = data.data.batchResult
        
        // Update intelligence profiles with batch results
        setIntelligenceProfiles(prev => {
          const newProfiles = [...prev]
          batchResult.results.forEach((profile: IntelligenceProfile) => {
            const existing = newProfiles.findIndex(p => p.connectionId === profile.connectionId)
            if (existing >= 0) {
              newProfiles[existing] = profile
            } else {
              newProfiles.push(profile)
            }
          })
          return newProfiles
        })

        setBatchProgress({ completed: batchResult.completed, total: batchResult.totalConnections })

        toast.success(`Batch research completed!`, {
          description: `${batchResult.completed} successful, ${batchResult.failed} failed. ${batchResult.summary.highValueProspects} high-value prospects identified.`
        })

        // Clear selection
        setSelectedConnections([])

      } else {
        throw new Error(data.error || 'Batch research failed')
      }

    } catch (error: any) {
      console.error('Error in batch research:', error)
      toast.error(`Batch research failed: ${error.message}`)
    } finally {
      setBatchProcessing(false)
    }
  }

  const toggleConnectionSelection = (connectionId: string) => {
    setSelectedConnections(prev => {
      if (prev.includes(connectionId)) {
        return prev.filter(id => id !== connectionId)
      } else {
        return [...prev, connectionId]
      }
    })
  }

  const selectAllConnections = () => {
    const filteredIds = getFilteredConnections().map(c => c.id)
    setSelectedConnections(filteredIds)
  }

  const clearSelection = () => {
    setSelectedConnections([])
  }

  const getFilteredConnections = () => {
    let filtered = connections.filter(connection => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          connection.full_name.toLowerCase().includes(searchLower) ||
          (connection.current_company?.toLowerCase() || '').includes(searchLower) ||
          (connection.title?.toLowerCase() || '').includes(searchLower)
        )
      }
      return true
    })

    // Status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(connection => {
        const profile = intelligenceProfiles.find(p => p.connectionId === connection.id)
        
        switch (filterBy) {
          case 'high_value':
            return profile?.unifiedScores.overallExpertise > 70
          case 'verified':
            return profile?.intelligenceAssessment.verificationStatus === 'verified'
          case 'unresearched':
            return !profile
          default:
            return true
        }
      })
    }

    return filtered
  }

  const getConnectionProfile = (connectionId: string) => {
    return intelligenceProfiles.find(p => p.connectionId === connectionId)
  }

  const getVerificationBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default'
      case 'likely': return 'secondary'
      case 'unverified': return 'outline'
      default: return 'outline'
    }
  }

  const getExpertiseColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const stats = {
    totalConnections: connections.length,
    researchedConnections: intelligenceProfiles.length,
    highValueProspects: intelligenceProfiles.filter(p => p.unifiedScores.overallExpertise > 70).length,
    verifiedExperts: intelligenceProfiles.filter(p => p.intelligenceAssessment.verificationStatus === 'verified').length
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connection Intelligence</h2>
          <p className="text-muted-foreground">
            Research LinkedIn connections for talent management expertise using AI-powered analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={loadConnections}
            disabled={isLoading}
          >
            <Users className="mr-2 h-4 w-4" />
            {isLoading ? 'Loading...' : 'Refresh Connections'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConnections}</div>
            <p className="text-xs text-muted-foreground">LinkedIn connections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Researched</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.researchedConnections}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalConnections > 0 
                ? Math.round((stats.researchedConnections / stats.totalConnections) * 100)
                : 0}% coverage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Value Prospects</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.highValueProspects}</div>
            <p className="text-xs text-muted-foreground">Expertise score 70+</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Experts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.verifiedExperts}</div>
            <p className="text-xs text-muted-foreground">External validation confirmed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections by name, company, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Connections</SelectItem>
            <SelectItem value="high_value">High-Value Prospects</SelectItem>
            <SelectItem value="verified">Verified Experts</SelectItem>
            <SelectItem value="unresearched">Unresearched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch Actions */}
      {selectedConnections.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-sm font-medium">
                  {selectedConnections.length} connection{selectedConnections.length !== 1 ? 's' : ''} selected
                </p>
                {isBatchProcessing && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      Processing... {batchProgress.completed}/{batchProgress.total}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearSelection}
                  disabled={isBatchProcessing}
                >
                  Clear Selection
                </Button>
                <Button 
                  size="sm"
                  onClick={startBatchResearch}
                  disabled={isBatchProcessing}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  {isBatchProcessing ? 'Processing...' : 'Research Selected'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LinkedIn Connections</CardTitle>
              <CardDescription>
                Select connections to research for talent management expertise
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={selectAllConnections}>
                Select All Filtered
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Results
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getFilteredConnections().map((connection) => {
              const profile = getConnectionProfile(connection.id)
              const isSelected = selectedConnections.includes(connection.id)
              
              return (
                <div
                  key={connection.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleConnectionSelection(connection.id)}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <h4 className="font-semibold text-lg">{connection.full_name}</h4>
                          <p className="text-muted-foreground">
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

                      {profile && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center space-x-4">
                            <Badge variant={getVerificationBadgeVariant(profile.intelligenceAssessment.verificationStatus)}>
                              {profile.intelligenceAssessment.verificationStatus}
                            </Badge>
                            <span className={`text-sm font-medium ${getExpertiseColor(profile.unifiedScores.overallExpertise)}`}>
                              {profile.unifiedScores.overallExpertise}/100 Overall Expertise
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {profile.intelligenceAssessment.confidenceLevel}% confidence
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <span>Talent Mgmt: <strong>{profile.unifiedScores.talentManagement}</strong></span>
                            <span>People Dev: <strong>{profile.unifiedScores.peopleDevelopment}</strong></span>
                            <span>HR Tech: <strong>{profile.unifiedScores.hrTechnology}</strong></span>
                            <span>Leadership: <strong>{profile.unifiedScores.thoughtLeadership}</strong></span>
                          </div>

                          {profile.intelligenceAssessment.strengths.length > 0 && (
                            <div className="text-xs">
                              <strong>Key Strengths:</strong> {profile.intelligenceAssessment.strengths.slice(0, 2).join(', ')}
                              {profile.intelligenceAssessment.strengths.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      {profile ? (
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => researchSingleConnection(connection.id)}
                          disabled={isLoading}
                        >
                          <Brain className="mr-2 h-4 w-4" />
                          Research
                        </Button>
                      )}
                      
                      {profile && (
                        <div className="text-right text-xs text-muted-foreground">
                          <div>Researched {new Date(profile.researched_at).toLocaleDateString()}</div>
                          <div>{profile.researchDuration}s duration</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {getFilteredConnections().length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No connections found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterBy !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Load your LinkedIn connections to get started'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}