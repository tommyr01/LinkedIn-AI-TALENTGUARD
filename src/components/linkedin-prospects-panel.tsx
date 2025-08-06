"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Target, 
  Star, 
  Building2, 
  User, 
  MessageSquare, 
  Calendar,
  Search,
  Plus,
  ExternalLink,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { toast } from "sonner"

interface LinkedInProspect {
  id: string
  name: string
  headline: string
  company: string
  role: string
  profileUrl: string
  profilePicture: string
  icpScore: number
  icpCategory: 'High Value' | 'Medium Value' | 'Low Value' | 'Not Qualified'
  icpConfidence: number
  dataQuality: 'high' | 'medium' | 'low'
  totalComments: number
  lastEngagementDate: string
  isResearched: boolean
  lastResearchedAt?: string
  signals: string[]
  tags: string[]
  reasoning: string[]
  createdAt: string
}

interface ProspectsStats {
  totalProspects: number
  highValueProspects: number
  mediumValueProspects: number
  lowValueProspects: number
  averageIcpScore: number
  totalEngagements: number
  researchedProspects: number
  categoryBreakdown: {
    'High Value': number
    'Medium Value': number
    'Low Value': number
    'Not Qualified': number
  }
  topCompanies: Array<{ company: string; count: number }>
  recentEngagements: Array<{
    name: string
    company: string
    lastEngagement: string
    icpScore: number
  }>
}

export function LinkedInProspectsPanel() {
  const [prospects, setProspects] = useState<LinkedInProspect[]>([])
  const [stats, setStats] = useState<ProspectsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set())

  // Fetch prospects from TalentGuard API
  const fetchProspects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/linkedin/prospects?minScore=50&limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setProspects(data.prospects)
        setStats(data.stats)
        console.log(`✅ Loaded ${data.prospects.length} LinkedIn prospects`)
      } else {
        throw new Error(data.error || 'Failed to fetch prospects')
      }

    } catch (error: any) {
      console.error('Error fetching LinkedIn prospects:', error)
      toast.error(`Failed to load prospects: ${error.message}`)
      
      // Set empty state on error
      setProspects([])
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter prospects based on search and category
  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = 
      prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.headline.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || prospect.icpCategory === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Handle prospect selection
  const toggleProspectSelection = (prospectId: string) => {
    const newSelection = new Set(selectedProspects)
    if (newSelection.has(prospectId)) {
      newSelection.delete(prospectId)
    } else {
      newSelection.add(prospectId)
    }
    setSelectedProspects(newSelection)
  }

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedProspects.size === 0) {
      toast.error('Please select prospects first')
      return
    }

    try {
      const response = await fetch('/api/linkedin/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          prospectIds: Array.from(selectedProspects),
          data: {}
        })
      })

      if (!response.ok) {
        throw new Error('Bulk action failed')
      }

      const result = await response.json()
      toast.success(`${action.replace('_', ' ')} completed for ${selectedProspects.size} prospects`)
      setSelectedProspects(new Set())
      
      // Refresh data if needed
      if (action === 'add_to_contacts') {
        fetchProspects()
      }

    } catch (error: any) {
      toast.error(`Failed to perform bulk action: ${error.message}`)
    }
  }

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    
    if (diffInDays < 1) return 'Today'
    if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get ICP category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'High Value': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium Value': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Low Value': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-blue-600'
    return 'text-yellow-600'
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              LinkedIn Prospects
            </CardTitle>
            <CardDescription>
              High-value prospects engaging with your content
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProspects}
            disabled={isLoading}
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {stats && !isLoading && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.highValueProspects}</div>
              <div className="text-xs text-muted-foreground">High Value</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{stats.averageIcpScore}</div>
              <div className="text-xs text-muted-foreground">Avg ICP Score</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="High Value">High Value</SelectItem>
              <SelectItem value="Medium Value">Medium Value</SelectItem>
              <SelectItem value="Low Value">Low Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedProspects.size > 0 && (
          <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700 flex-1">
              {selectedProspects.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('add_to_contacts')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Contacts
            </Button>
          </div>
        )}

        {/* Prospects List */}
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProspects.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {prospects.length === 0 
                  ? "No prospects found. Sync your LinkedIn posts to identify prospects from engagement." 
                  : "No prospects match your filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    selectedProspects.has(prospect.id) ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => toggleProspectSelection(prospect.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={prospect.profilePicture} alt={prospect.name} />
                      <AvatarFallback>{prospect.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">{prospect.name}</h4>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(prospect.icpCategory)}`}
                          >
                            {prospect.icpScore}
                          </Badge>
                          {prospect.profileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(prospect.profileUrl, '_blank')
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {prospect.role} at {prospect.company}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {prospect.totalComments} engagements
                          </span>
                          {prospect.lastEngagementDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(prospect.lastEngagementDate)}
                            </span>
                          )}
                        </div>

                        {/* Confidence indicator */}
                        <div className="flex items-center gap-2">
                          <div className={`text-xs ${getConfidenceColor(prospect.icpConfidence)}`}>
                            {prospect.icpConfidence}% confidence
                          </div>
                          {prospect.isResearched && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-2 w-2 mr-1" />
                              Researched
                            </Badge>
                          )}
                        </div>

                        {/* Tags */}
                        {prospect.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prospect.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {prospect.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{prospect.tags.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="pt-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('/dashboard/linkedin/prospects', '_self')}
          >
            View All Prospects
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}