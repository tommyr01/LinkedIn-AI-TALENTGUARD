'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ExternalLink,
  Calendar,
  BookOpen,
  FileText,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'

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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Published Articles & Content</h3>
        <p className="text-muted-foreground">
          {totalArticles} article{totalArticles !== 1 ? 's' : ''} found for {connection.full_name}
        </p>
      </div>

      {/* LinkedIn Articles */}
      {linkedInArticles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold">LinkedIn Articles</h4>
            <Badge variant="secondary">{linkedInArticles.length}</Badge>
          </div>
          
          {linkedInArticles.map((article, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(article.publishedDate), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{article.engagement.likes} likes</span>
                        <span>{article.engagement.comments} comments</span>
                        <span>{article.engagement.shares} shares</span>
                      </div>
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
                  {article.content}
                </p>
                
                {getTopicTags(article.content).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getTopicTags(article.content).map((topic, topicIndex) => (
                      <Badge key={topicIndex} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Web Articles */}
      {webArticles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Web Publications</h4>
            <Badge variant="secondary">{webArticles.length}</Badge>
          </div>
          
          {webArticles.map((article, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(article.publishedDate), 'MMM d, yyyy')}
                      </div>
                      <span>Source: {article.source}</span>
                      {article.relevanceScore && (
                        <Badge variant="outline" className="text-xs">
                          {article.relevanceScore}% relevant
                        </Badge>
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
                  {article.content}
                </p>
                
                {getTopicTags(article.content).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getTopicTags(article.content).map((topic, topicIndex) => (
                      <Badge key={topicIndex} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}