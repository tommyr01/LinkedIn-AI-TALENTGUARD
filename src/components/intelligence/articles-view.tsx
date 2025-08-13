'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  ExternalLink,
  Calendar,
  BookOpen,
  FileText,
  Globe,
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

interface Article {
  title: string
  url?: string
  content: string
  publishedDate: string
  source: string
  relevanceScore?: number
}

interface LinkedInArticle {
  title: string
  url?: string
  content: string
  publishedDate: string
  engagement: {
    likes: number
    comments: number
    shares: number
  }
}

interface ArticlesViewProps {
  connection: {
    full_name: string
    current_company?: string
    title?: string
  }
  profile: {
    linkedInAnalysis?: {
      articles_analysis?: LinkedInArticle[]
    }
    webResearch?: {
      articles_found?: Article[]
    }
  }
}

export function ArticlesView({ connection, profile }: ArticlesViewProps) {
  const linkedInArticles = profile.linkedInAnalysis?.articles_analysis || []
  const webArticles = profile.webResearch?.articles_found || []
  
  const totalArticles = linkedInArticles.length + webArticles.length

  if (totalArticles === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Published Articles Found</h3>
          <p className="text-muted-foreground">
            We couldn't find any published articles or content for {connection.full_name} yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const generateInsights = () => {
    const allArticles = [...linkedInArticles.map(a => ({ ...a, type: 'linkedin' })), ...webArticles.map(a => ({ ...a, type: 'web' }))]
    const now = new Date()
    
    // Posting frequency analysis
    const sortedByDate = allArticles
      .filter(article => article.publishedDate && typeof article.publishedDate === 'string')
      .map(article => ({ ...article, parsedDate: parseISO(article.publishedDate) }))
      .filter(article => !isNaN(article.parsedDate.getTime()))
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())
    
    const mostRecentPost = sortedByDate.length > 0 ? sortedByDate[0] : null
    const oldestPost = sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1] : null
    
    // Publishing platforms
    const platforms = {
      linkedin: linkedInArticles.length,
      web: webArticles.length
    }
    
    // Web sources analysis
    const webSources = webArticles.reduce((acc, article) => {
      acc[article.source] = (acc[article.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Topic analysis (enhanced)
    const allContent = allArticles.map(a => a.content || '').join(' ').toLowerCase()
    const topicCounts: Record<string, number> = {}
    
    const topics = [
      'talent management', 'talent acquisition', 'people development', 'employee development',
      'leadership', 'management', 'hr', 'human resources', 'culture', 'workplace culture',
      'recruitment', 'hiring', 'performance', 'training', 'coaching', 'mentoring',
      'diversity', 'inclusion', 'employee engagement', 'retention', 'onboarding'
    ]
    
    topics.forEach(topic => {
      const count = (allContent.match(new RegExp(topic, 'g')) || []).length
      if (count > 0) {
        topicCounts[topic] = count
      }
    })
    
    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))
    
    // Engagement analysis for LinkedIn posts
    const linkedInEngagement = linkedInArticles.reduce((acc, article) => {
      if (article.engagement) {
        acc.totalLikes += article.engagement.likes || 0
        acc.totalComments += article.engagement.comments || 0
        acc.totalShares += article.engagement.shares || 0
      }
      return acc
    }, { totalLikes: 0, totalComments: 0, totalShares: 0 })
    
    const avgEngagement = linkedInArticles.length > 0 ? {
      likes: Math.round(linkedInEngagement.totalLikes / linkedInArticles.length),
      comments: Math.round(linkedInEngagement.totalComments / linkedInArticles.length),
      shares: Math.round(linkedInEngagement.totalShares / linkedInArticles.length)
    } : null
    
    return {
      totalPosts: totalArticles,
      mostRecentPost,
      oldestPost,
      platforms,
      webSources,
      topTopics,
      avgEngagement,
      sortedByDate
    }
  }
  
  const insights = generateInsights()

  const getTopicTags = (content: string) => {
    const topics = []
    const contentLower = content.toLowerCase()
    
    if (contentLower.includes('talent management') || contentLower.includes('talent acquisition')) {
      topics.push('Talent Management')
    }
    if (contentLower.includes('people development') || contentLower.includes('employee development')) {
      topics.push('People Development')
    }
    if (contentLower.includes('leadership') || contentLower.includes('management')) {
      topics.push('Leadership')
    }
    if (contentLower.includes('hr') || contentLower.includes('human resources')) {
      topics.push('HR')
    }
    if (contentLower.includes('culture') || contentLower.includes('workplace culture')) {
      topics.push('Culture')
    }
    
    return topics
  }

  const renderArticleCard = (article: any, index: number, type: 'linkedin' | 'web') => (
    <Card key={index} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{article.title || 'Untitled Article'}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {article.publishedDate ? format(new Date(article.publishedDate), 'MMM d, yyyy') : 'Date unavailable'}
              </div>
              {type === 'linkedin' ? (
                <div className="flex items-center gap-3">
                  <span>{article.engagement?.likes || 0} likes</span>
                  <span>{article.engagement?.comments || 0} comments</span>
                  <span>{article.engagement?.shares || 0} shares</span>
                </div>
              ) : (
                <>
                  <span>Source: {article.source}</span>
                  {article.relevanceScore && (
                    <Badge variant="outline" className="text-xs">
                      {article.relevanceScore}% relevant
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
          {article.url && (
            <Button variant="outline" size="sm" asChild>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Read Article
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {article.content || 'No content available'}
        </p>
        
        {getTopicTags(article.content || '').length > 0 && (
          <div className="flex flex-wrap gap-2">
            {getTopicTags(article.content || '').map((topic, topicIndex) => (
              <Badge key={topicIndex} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Published Articles & Content</h3>
        <p className="text-muted-foreground">
          {totalArticles} article{totalArticles !== 1 ? 's' : ''} found for {connection.full_name}
        </p>
      </div>

      <Tabs defaultValue="linkedin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="linkedin" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            LinkedIn ({linkedInArticles.length})
          </TabsTrigger>
          <TabsTrigger value="web" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Web Articles ({webArticles.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="linkedin" className="space-y-4">
          {linkedInArticles.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">LinkedIn Articles</h4>
                <Badge variant="secondary">{linkedInArticles.length}</Badge>
              </div>
              
              {linkedInArticles.map((article, index) => 
                renderArticleCard(article, index, 'linkedin')
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No LinkedIn Articles Found</h3>
                <p className="text-muted-foreground">
                  No LinkedIn articles or posts found for {connection.full_name}.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="web" className="space-y-4">
          {webArticles.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Web Publications</h4>
                <Badge variant="secondary">{webArticles.length}</Badge>
              </div>
              
              {webArticles.map((article, index) => 
                renderArticleCard(article, index, 'web')
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Web Articles Found</h3>
                <p className="text-muted-foreground">
                  No web publications found for {connection.full_name}.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Publishing Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Publishing Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Articles:</span>
                  <Badge variant="secondary">{insights.totalPosts}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">LinkedIn Posts:</span>
                  <Badge variant="outline">{insights.platforms.linkedin}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Web Publications:</span>
                  <Badge variant="outline">{insights.platforms.web}</Badge>
                </div>
                {insights.mostRecentPost && (
                  <div className="pt-2">
                    <span className="text-sm font-medium">Most Recent:</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(insights.mostRecentPost.parsedDate, { addSuffix: true })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Top Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.topTopics.length > 0 ? (
                  <div className="space-y-2">
                    {insights.topTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{topic.topic.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                        <Badge variant="outline" className="text-xs">{topic.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific topics identified</p>
                )}
              </CardContent>
            </Card>

            {/* LinkedIn Engagement */}
            {insights.avgEngagement && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    LinkedIn Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. Likes:</span>
                    <Badge variant="secondary">{insights.avgEngagement.likes}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. Comments:</span>
                    <Badge variant="secondary">{insights.avgEngagement.comments}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. Shares:</span>
                    <Badge variant="secondary">{insights.avgEngagement.shares}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Web Sources */}
            {Object.keys(insights.webSources).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Publishing Platforms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(insights.webSources).map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm">{source}</span>
                        <Badge variant="outline" className="text-xs">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Publishing Timeline */}
            {insights.sortedByDate.length > 1 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Publishing Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Content published over {insights.oldestPost ? formatDistanceToNow(insights.oldestPost.parsedDate) : 'unknown period'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {insights.sortedByDate.slice(0, 10).map((article, index) => (
                        <Badge key={index} variant="outline" className="text-xs" title={article.title}>
                          {format(article.parsedDate, 'MMM yy')}
                        </Badge>
                      ))}
                      {insights.sortedByDate.length > 10 && (
                        <Badge variant="outline" className="text-xs">+{insights.sortedByDate.length - 10} more</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}