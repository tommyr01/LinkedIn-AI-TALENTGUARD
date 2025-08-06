"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertCircle,
  Filter,
  Download,
  UserPlus,
  Signal
} from 'lucide-react'
import { toast } from "sonner"

// Types matching our API response
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

export default function LinkedInProspectsPage() {
  const [prospects, setProspects] = useState<LinkedInProspect[]>([])
  const [stats, setStats] = useState<ProspectsStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [minScoreFilter, setMinScoreFilter] = useState<string>("50")
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const prospectsPerPage = 20

  // Fetch prospects from TalentGuard API
  const fetchProspects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/linkedin/prospects?minScore=${minScoreFilter}&limit=200`, {
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
        toast.success(`Loaded ${data.prospects.length} LinkedIn prospects`)
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

  // Pagination logic
  const totalPages = Math.ceil(filteredProspects.length / prospectsPerPage)
  const startIndex = (currentPage - 1) * prospectsPerPage
  const paginatedProspects = filteredProspects.slice(startIndex, startIndex + prospectsPerPage)

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

  const toggleSelectAll = () => {
    if (selectedProspects.size === paginatedProspects.length) {
      setSelectedProspects(new Set())
    } else {
      setSelectedProspects(new Set(paginatedProspects.map(p => p.id)))
    }
  }

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedProspects.size === 0) {
      toast.error('Please select prospects first')
      return
    }

    setIsProcessing(true)
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
    } finally {
      setIsProcessing(false)
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

  useEffect(() => {
    fetchProspects()
  }, [minScoreFilter])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, categoryFilter])

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">LinkedIn Prospects</h2>
          <p className="text-muted-foreground">
            High-value prospects identified from LinkedIn engagement patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchProspects}
            disabled={isLoading}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/dashboard/linkedin/my-posts', '_self')}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            View Posts
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && !isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Prospects
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProspects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.researchedProspects} researched
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                High Value Prospects
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.highValueProspects}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.highValueProspects / stats.totalProspects) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average ICP Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageIcpScore}</div>
              <p className="text-xs text-muted-foreground">
                out of 100 points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Engagements
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEngagements}</div>
              <p className="text-xs text-muted-foreground">
                LinkedIn interactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search prospects by name, company, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="High Value">High Value</SelectItem>
              <SelectItem value="Medium Value">Medium Value</SelectItem>
              <SelectItem value="Low Value">Low Value</SelectItem>
            </SelectContent>
          </Select>

          <Select value={minScoreFilter} onValueChange={setMinScoreFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Min Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">Score ≥ 50</SelectItem>
              <SelectItem value="60">Score ≥ 60</SelectItem>
              <SelectItem value="70">Score ≥ 70</SelectItem>
              <SelectItem value="80">Score ≥ 80</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProspects.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedProspects.size} prospect{selectedProspects.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('add_to_contacts')}
                disabled={isProcessing}
                className="gap-2"
              >
                <UserPlus className="h-3 w-3" />
                Add to Contacts
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('generate_signals')}
                disabled={isProcessing}
                className="gap-2"
              >
                <Signal className="h-3 w-3" />
                Generate Signals
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedProspects(new Set())}
                disabled={isProcessing}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Prospects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prospects List</CardTitle>
              <CardDescription>
                {filteredProspects.length} of {prospects.length} prospects
                {(searchTerm || categoryFilter !== "all") && " (filtered)"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProspects.size === paginatedProspects.length && paginatedProspects.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border-b">
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProspects.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {prospects.length === 0 
                  ? "No prospects found. Sync your LinkedIn posts to identify prospects from engagement." 
                  : "No prospects match your filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    selectedProspects.has(prospect.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedProspects.has(prospect.id)}
                      onCheckedChange={() => toggleProspectSelection(prospect.id)}
                    />
                    
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={prospect.profilePicture} alt={prospect.name} />
                      <AvatarFallback>{prospect.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium truncate">{prospect.name}</h3>
                        <div className="flex items-center gap-2">
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
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(prospect.profileUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {prospect.role} at {prospect.company}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span className={
                              prospect.icpConfidence >= 80 ? 'text-green-600' :
                              prospect.icpConfidence >= 60 ? 'text-blue-600' : 'text-yellow-600'
                            }>
                              {prospect.icpConfidence}% confidence
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {prospect.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prospect.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {prospect.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{prospect.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {prospect.isResearched && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <Star className="h-2 w-2 mr-1" />
                            Researched
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + prospectsPerPage, filteredProspects.length)} of {filteredProspects.length} prospects
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1 + Math.max(0, currentPage - 3)
                if (page > totalPages) return null
                const isCurrentPage = page === currentPage
                return (
                  <Button
                    key={page}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}