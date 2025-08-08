"use client"

import React, { memo, useMemo, useCallback, useState } from "react"
import { MessageSquare, ThumbsUp, Search, Grid, List, ExternalLink, FileText, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GridLoadingSkeleton, EmptyState } from "@/components/loading-states"

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

interface OptimizedLinkedInPostsTableProps {
  posts: LinkedInPost[]
  stats: PostStats
  onRefresh?: () => void
  isLoading?: boolean
}

// Memoized post card component
const PostCard = memo(function PostCard({ post }: { post: LinkedInPost }) {
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    })
  }, [])

  const getEngagementColor = useCallback((reactions: number) => {
    if (reactions >= 100) return "bg-green-100 text-green-800"
    if (reactions >= 50) return "bg-blue-100 text-blue-800"
    if (reactions >= 10) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-600"
  }, [])

  const handleExternalClick = useCallback(() => {
    if (post.postUrl) {
      window.open(post.postUrl, '_blank', 'noopener,noreferrer')
    }
  }, [post.postUrl])

  const handleViewDetails = useCallback(() => {
    if (post.postUrl) {
      window.open(post.postUrl, '_blank', 'noopener,noreferrer')
    }
  }, [post.postUrl])

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {post.authorProfilePicture && (
                <img 
                  src={post.authorProfilePicture} 
                  alt={post.connectionName}
                  className="h-8 w-8 rounded-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-medium truncate">
                  {post.connectionName}
                </CardTitle>
                {post.connectionCompany && (
                  <p className="text-xs text-muted-foreground truncate">
                    {post.connectionCompany}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
          {post.postUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={handleExternalClick}
              aria-label="Open post in LinkedIn"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
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
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
              {(post.support || 0) > 0 && <span>👏 {post.support}</span>}
              {(post.love || 0) > 0 && <span>❤️ {post.love}</span>}
              {(post.insight || 0) > 0 && <span>💡 {post.insight}</span>}
              {(post.celebrate || 0) > 0 && <span>🎉 {post.celebrate}</span>}
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  )
})

// Memoized filter controls
const FilterControls = memo(function FilterControls({
  searchTerm,
  timeFilter,
  onSearchChange,
  onTimeFilterChange
}: {
  searchTerm: string
  timeFilter: string
  onSearchChange: (value: string) => void
  onTimeFilterChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center space-x-2 flex-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search posts or content..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          {(['all', '1day', '7day', '1month'] as const).map((filter) => (
            <Button
              key={filter}
              variant={timeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => onTimeFilterChange(filter)}
            >
              {filter === 'all' ? 'All' : 
               filter === '1day' ? 'Today' : 
               filter === '7day' ? 'Week' : 'Month'}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
})

// Memoized pagination component
const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange
}: {
  currentPage: number
  totalPages: number
  startIndex: number
  endIndex: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const handlePrevious = useCallback(() => {
    onPageChange(Math.max(1, currentPage - 1))
  }, [currentPage, onPageChange])

  const handleNext = useCallback(() => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }, [currentPage, totalPages, onPageChange])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1} to {endIndex} of {totalItems} posts
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
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
                onClick={() => onPageChange(page)}
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
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
})

export const OptimizedLinkedInPostsTable = memo(function OptimizedLinkedInPostsTable({ 
  posts, 
  stats, 
  onRefresh, 
  isLoading = false 
}: OptimizedLinkedInPostsTableProps) {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState<"all" | "1day" | "3day" | "7day" | "1month">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  
  const postsPerPage = 12

  // Memoized filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
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
  }, [posts, searchTerm, timeFilter])

  // Memoized pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = Math.min(startIndex + postsPerPage, filteredPosts.length)
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage)
    
    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedPosts
    }
  }, [filteredPosts, currentPage, postsPerPage])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, timeFilter])

  // Memoized handlers
  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === "grid" ? "list" : "grid")
  }, [])

  const handleRefresh = useCallback(() => {
    onRefresh?.()
  }, [onRefresh])

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
            onClick={handleViewModeToggle}
            aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">
              {viewMode === "grid" ? "List View" : "Grid View"}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterControls
        searchTerm={searchTerm}
        timeFilter={timeFilter}
        onSearchChange={setSearchTerm}
        onTimeFilterChange={setTimeFilter}
      />

      {/* Posts Grid/List */}
      {isLoading ? (
        <GridLoadingSkeleton items={8} columns={4} />
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          title="No posts found"
          description={
            searchTerm || timeFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "No LinkedIn posts available yet. Click 'Sync from LinkedIn' to import your posts."
          }
        />
      ) : (
        <div className={viewMode === "grid" 
          ? "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "space-y-4 max-w-4xl"
        }>
          {paginationData.paginatedPosts.map((post) => (
            <PostCard key={post.postUrn} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={paginationData.totalPages}
        startIndex={paginationData.startIndex}
        endIndex={paginationData.endIndex}
        totalItems={filteredPosts.length}
        onPageChange={setCurrentPage}
      />
    </div>
  )
})