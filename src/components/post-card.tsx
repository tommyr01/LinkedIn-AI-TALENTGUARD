"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, User, ExternalLink, FileText, Loader2, Sparkles } from 'lucide-react'

export type ConnectionPost = {
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
}

interface PostCardProps {
  post: ConnectionPost
  onGenerateComment?: (post: ConnectionPost) => void
  onOpenDetails: (post: ConnectionPost) => void
  isGenerating?: boolean
  selectedPostId?: string
}

export function PostCard({ 
  post, 
  onGenerateComment, 
  onOpenDetails, 
  isGenerating = false,
  selectedPostId 
}: PostCardProps) {
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

  const isThisPostGenerating = isGenerating && selectedPostId === post.id

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {post.authorProfilePicture ? (
                <img 
                  src={post.authorProfilePicture} 
                  alt={post.connectionName}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <User className="h-8 w-8 rounded-full bg-muted p-1" />
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
                <span className="text-xs">🔄 {post.reposts} reposts</span>
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onOpenDetails(post)}
          >
            View Details
          </Button>
          
          {onGenerateComment && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onGenerateComment(post)}
              disabled={isThisPostGenerating}
              className="flex items-center gap-2"
            >
              {isThisPostGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI Comment
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}