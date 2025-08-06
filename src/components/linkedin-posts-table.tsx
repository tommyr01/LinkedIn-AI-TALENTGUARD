"use client"

import * as React from "react"
import { useState } from "react"
import { MessageSquare, ThumbsUp, User, TrendingUp, Search, Grid, List, ExternalLink, FileText, Calendar, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Types for TalentGuard LinkedIn posts
export type LinkedInPost = {
  id: string
  connectionName: string
  connectionCompany?: string
  content: string
  postedAt: string
  postUrn: string
  postUrl?: string
  likesCount: number
  commentsCount: number
  totalReactions: number
  reposts: number
  authorFirstName: string
  authorLastName: string
  authorHeadline?: string
  authorLinkedInUrl?: string
  authorProfilePicture?: string
  postType: string
  mediaType?: string
  mediaUrl?: string
  mediaThumbnail?: string
  createdTime: string
  hasMedia?: boolean
  documentTitle?: string
  documentPageCount?: number
  support?: number
  love?: number
  insight?: number
  celebrate?: number
  lastSyncedAt?: string
}

export type PostStats = {
  totalPosts: number
  totalLikes: number
  totalComments: number
  totalReactions: number
  uniqueConnections: number
  averageEngagement: number
  totalReposts: number
  totalSupport: number
  totalLove: number
  totalInsight: number
  totalCelebrate: number
  postsWithMedia: number
  documentsShared: number
}

interface LinkedInPostsTableProps {
  posts: LinkedInPost[]
  stats: PostStats
  onRefresh?: () => void
  isLoading?: boolean
}

export function LinkedInPostsTable({ posts, stats, onRefresh, isLoading = false }: LinkedInPostsTableProps) {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState<"all" | "1day" | "3day" | "7day" | "1month">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 12

  // Filter and search logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.connectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.connectionCompany && post.connectionCompany.toLowerCase().includes(searchTerm.toLowerCase()))

    // Time filter logic
    const matchesTimeFilter = (() => {
      if (timeFilter === "all") return true
      
      const postDate = new Date(post.postedAt)
      const now = new Date()
      const diffInMs = now.getTime() - postDate.getTime()
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
      
      switch (timeFilter) {
        case "1day": return diffInDays <= 1
        case "3day": return diffInDays <= 3
        case "7day": return diffInDays <= 7
        case "1month": return diffInDays <= 30
        default: return true
      }
    })()

    return matchesSearch && matchesTimeFilter
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage)

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, timeFilter])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    })
  }

  const getEngagementColor = (reactions: number) => {
    if (reactions >= 100) return "bg-green-100 text-green-800"
    if (reactions >= 50) return "bg-blue-100 text-blue-800"
    if (reactions >= 10) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Your LinkedIn Posts</h3>
          <p className="text-muted-foreground">
            {filteredPosts.length} of {posts.length} posts
            {(searchTerm || timeFilter !== "all") && " (filtered)"}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">{viewMode === "grid" ? "List View" : "Grid View"}</span>
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={timeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter("all")}
            >
              All
            </Button>
            <Button
              variant={timeFilter === "1day" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter("1day")}
            >
              Today
            </Button>
            <Button
              variant={timeFilter === "7day" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter("7day")}
            >
              Week
            </Button>
            <Button
              variant={timeFilter === "1month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter("1month")}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Posts Grid/List */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-80">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="text-2xl font-semibold text-muted-foreground">No posts found</div>
              <div className="text-muted-foreground">
                {searchTerm || timeFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "No LinkedIn posts available yet. Click 'Sync from LinkedIn' to import your posts."}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "space-y-4 max-w-4xl"
        }>
          {paginatedPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.authorProfilePicture && (
                        <img 
                          src={post.authorProfilePicture} 
                          alt={post.connectionName}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <div>
                        <CardTitle className="text-sm font-medium">{post.connectionName}</CardTitle>
                        {post.connectionCompany && (
                          <p className="text-xs text-muted-foreground">{post.connectionCompany}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {post.postType}
                      </Badge>
                      {post.hasMedia && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Media
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.postedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {post.postUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(post.postUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Post Content */}
                <div>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {post.content}
                  </p>
                </div>

                {/* Document Info */}
                {post.documentTitle && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{post.documentTitle}</p>
                      {post.documentPageCount && (
                        <p className="text-xs text-muted-foreground">{post.documentPageCount} pages</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Engagement Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={`text-xs ${getEngagementColor(post.totalReactions)}`}
                    >
                      {post.totalReactions} total reactions
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-blue-600" />
                      <span>{post.likesCount} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-green-600" />
                      <span>{post.commentsCount} comments</span>
                    </div>
                    {post.reposts > 0 && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-purple-600" />
                        <span>{post.reposts} reposts</span>
                      </div>
                    )}
                  </div>

                  {/* Extended engagement types */}
                  {(post.support || post.love || post.insight || post.celebrate) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {post.support > 0 && <span>👏 {post.support}</span>}
                      {post.love > 0 && <span>❤️ {post.love}</span>}
                      {post.insight > 0 && <span>💡 {post.insight}</span>}
                      {post.celebrate > 0 && <span>🎉 {post.celebrate}</span>}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    // Future: Open post details or analytics
                    if (post.postUrl) {
                      window.open(post.postUrl, '_blank')
                    }
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + postsPerPage, filteredPosts.length)} of {filteredPosts.length} posts
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
                const page = i + 1
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