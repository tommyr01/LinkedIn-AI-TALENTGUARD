"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare, Share2, TrendingUp, FileText, Clock } from 'lucide-react'

interface PostStats {
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

interface LinkedInStatsCardsProps {
  stats: PostStats
  lastSync?: string | null
}

export function LinkedInStatsCards({ stats, lastSync }: LinkedInStatsCardsProps) {
  const formatLastSync = (syncTime: string | null) => {
    if (!syncTime) return 'Never'
    const date = new Date(syncTime)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getSyncColor = (syncTime: string | null) => {
    if (!syncTime) return 'bg-gray-100 text-gray-600'
    
    const date = new Date(syncTime)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) return 'bg-green-100 text-green-700'
    if (diffInHours < 72) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Posts
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPosts}</div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {stats.postsWithMedia} with media
            </p>
            <Badge className={getSyncColor(lastSync)}>
              <Clock className="h-3 w-3 mr-1" />
              {formatLastSync(lastSync)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Total Engagement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Reactions
          </CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReactions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalLikes} likes • {stats.totalComments} comments
          </p>
          <div className="flex items-center gap-2 mt-1">
            {stats.totalSupport > 0 && (
              <span className="text-xs">👏 {stats.totalSupport}</span>
            )}
            {stats.totalLove > 0 && (
              <span className="text-xs">❤️ {stats.totalLove}</span>
            )}
            {stats.totalInsight > 0 && (
              <span className="text-xs">💡 {stats.totalInsight}</span>
            )}
            {stats.totalCelebrate > 0 && (
              <span className="text-xs">🎉 {stats.totalCelebrate}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Average Engagement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Engagement
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageEngagement}</div>
          <p className="text-xs text-muted-foreground">
            reactions per post
          </p>
          {stats.totalPosts > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.totalComments / stats.totalPosts) * 100).toFixed(1)}% comment rate
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reposts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Reposts & Shares
          </CardTitle>
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReposts}</div>
          <p className="text-xs text-muted-foreground">
            total reposts
          </p>
          {stats.documentsShared > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {stats.documentsShared} documents shared
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}