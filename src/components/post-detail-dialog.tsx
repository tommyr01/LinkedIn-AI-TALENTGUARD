"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  ThumbsUp, 
  MessageSquare, 
  ExternalLink, 
  FileText, 
  Calendar,
  Sparkles,
  Loader2,
  Building,
  MapPin 
} from 'lucide-react'
import { ConnectionPost } from './post-card'

interface PostDetailDialogProps {
  post: ConnectionPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateComment?: (post: ConnectionPost) => void
  isGenerating?: boolean
  selectedPostId?: string
}

export function PostDetailDialog({ 
  post, 
  open, 
  onOpenChange,
  onGenerateComment,
  isGenerating = false,
  selectedPostId
}: PostDetailDialogProps) {
  if (!post) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getEngagementColor = (reactions: number) => {
    if (reactions >= 100) return "text-green-600"
    if (reactions >= 50) return "text-blue-600"
    if (reactions >= 10) return "text-yellow-600"
    return "text-gray-600"
  }

  const isThisPostGenerating = isGenerating && selectedPostId === post.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LinkedIn Post Details</DialogTitle>
          <DialogDescription>
            View complete post content and engagement metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Author Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {post.authorProfilePicture ? (
                  <img 
                    src={post.authorProfilePicture} 
                    alt={post.connectionName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-lg font-semibold">{post.connectionName}</h3>
                    {post.authorHeadline && (
                      <p className="text-sm text-muted-foreground">{post.authorHeadline}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {post.connectionCompany && (
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{post.connectionCompany}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.postedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {post.postType}
                    </Badge>
                    {post.hasMedia && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Has Media
                      </Badge>
                    )}
                    {post.postUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(post.postUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on LinkedIn
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Document Info */}
                {post.documentTitle && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{post.documentTitle}</p>
                      {post.documentPageCount && (
                        <p className="text-xs text-muted-foreground">{post.documentPageCount} pages</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getEngagementColor(post.totalReactions)}`}>
                    {formatNumber(post.totalReactions)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Reactions</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(post.likesCount)}
                  </div>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(post.commentsCount)}
                  </div>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(post.reposts)}
                  </div>
                  <p className="text-xs text-muted-foreground">Reposts</p>
                </div>
              </div>

              {/* Extended reaction types */}
              {(post.support || post.love || post.insight || post.celebrate) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reaction Breakdown</p>
                    <div className="flex items-center gap-4 text-sm">
                      {(post.support || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <span>👏</span>
                          <span>{post.support} Support</span>
                        </div>
                      )}
                      {(post.love || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <span>❤️</span>
                          <span>{post.love} Love</span>
                        </div>
                      )}
                      {(post.insight || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <span>💡</span>
                          <span>{post.insight} Insight</span>
                        </div>
                      )}
                      {(post.celebrate || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <span>🎉</span>
                          <span>{post.celebrate} Celebrate</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
            
            {onGenerateComment && (
              <Button 
                onClick={() => onGenerateComment(post)}
                disabled={isThisPostGenerating}
                className="flex-1"
              >
                {isThisPostGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating AI Comment...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Comment
                  </>
                )}
              </Button>
            )}
            
            {post.postUrl && (
              <Button variant="outline" onClick={() => window.open(post.postUrl, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open LinkedIn
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}