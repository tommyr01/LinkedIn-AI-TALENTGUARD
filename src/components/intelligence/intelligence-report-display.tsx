'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  FileText,
  TrendingUp,
  MessageSquare,
  Globe,
  Award,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Target,
  Lightbulb,
  BookOpen,
  Users,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'

interface IntelligenceReportDisplayProps {
  profile: any // Using any for now since the full profile structure is complex
  connection: any
}

export function IntelligenceReportDisplay({ profile, connection }: IntelligenceReportDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Extract content themes from LinkedIn analysis
  const linkedInAnalysis = profile.linkedInAnalysis
  const contentThemes = linkedInAnalysis?.contentThemes
  const postsAnalysis = linkedInAnalysis?.posts_analysis || []
  const webResearch = profile.webResearch
  const articles = webResearch?.articles_found || []

  // Calculate key metrics
  const totalPosts = postsAnalysis.length
  const talentManagementPosts = postsAnalysis.filter((p: any) => p.topicRelevance > 50).length
  const highEngagementPosts = postsAnalysis.filter((p: any) => p.engagement > 30).length
  const thoughtLeadershipPosts = postsAnalysis.filter((p: any) => p.contentType === 'thought_leadership').length

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="linkedin">LinkedIn Analysis</TabsTrigger>
        <TabsTrigger value="articles">Published Articles</TabsTrigger>
        <TabsTrigger value="expertise">Expertise Evidence</TabsTrigger>
        <TabsTrigger value="insights">Key Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Professional Intelligence Summary
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of {connection.full_name}'s professional expertise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expertise Scores */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Expertise Assessment</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Talent Management</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={profile.unifiedScores.talentManagement} className="w-32" />
                    <span className="text-sm font-medium w-12 text-right">{profile.unifiedScores.talentManagement}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">People Development</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={profile.unifiedScores.peopleDevelopment} className="w-32" />
                    <span className="text-sm font-medium w-12 text-right">{profile.unifiedScores.peopleDevelopment}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">HR Technology</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={profile.unifiedScores.hrTechnology} className="w-32" />
                    <span className="text-sm font-medium w-12 text-right">{profile.unifiedScores.hrTechnology}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Leadership</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={profile.unifiedScores.thoughtLeadership || 0} className="w-32" />
                    <span className="text-sm font-medium w-12 text-right">{profile.unifiedScores.thoughtLeadership || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Key Strengths */}
            {profile.intelligenceAssessment.strengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Key Strengths
                </h4>
                <ul className="space-y-1">
                  {profile.intelligenceAssessment.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {profile.intelligenceAssessment.redFlags && profile.intelligenceAssessment.redFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                  Areas of Concern
                </h4>
                <ul className="space-y-1">
                  {profile.intelligenceAssessment.redFlags.map((flag: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="mr-2">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="linkedin" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              LinkedIn Content Analysis
            </CardTitle>
            <CardDescription>
              Analysis of {totalPosts} LinkedIn posts and engagement patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Posting Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{totalPosts}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Talent Focus</p>
                <p className="text-2xl font-bold">{talentManagementPosts}</p>
                <p className="text-xs text-muted-foreground">posts</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">High Engagement</p>
                <p className="text-2xl font-bold">{highEngagementPosts}</p>
                <p className="text-xs text-muted-foreground">30+ reactions</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Thought Leadership</p>
                <p className="text-2xl font-bold">{thoughtLeadershipPosts}</p>
                <p className="text-xs text-muted-foreground">posts</p>
              </div>
            </div>

            <Separator />

            {/* Content Themes */}
            {contentThemes?.mainTopics && contentThemes.mainTopics.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Main Content Themes</h4>
                <div className="space-y-2">
                  {contentThemes.mainTopics.slice(0, 5).map((topic: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{topic.theme}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{topic.frequency} posts</Badge>
                          <Badge variant="outline">Score: {topic.relevanceScore}</Badge>
                        </div>
                      </div>
                      {topic.examplePosts && topic.examplePosts.length > 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          "{topic.examplePosts[0]}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Posts */}
            {postsAnalysis.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Recent LinkedIn Posts</h4>
                <div className="space-y-3">
                  {postsAnalysis
                    .filter((post: any) => post.topicRelevance > 30 || post.engagement > 20)
                    .slice(0, 3)
                    .map((post: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.date), 'MMM d, yyyy')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {post.contentType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {post.engagement} reactions
                            </span>
                          </div>
                        </div>
                        <p className="text-sm line-clamp-3">
                          {post.content}
                        </p>
                        {post.topicRelevance > 50 && (
                          <Badge className="text-xs">
                            <Target className="mr-1 h-3 w-3" />
                            High Relevance ({post.topicRelevance})
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Talent Management Special Mention */}
            {contentThemes?.talentManagementInsights?.isExpert && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Award className="mr-2 h-4 w-4 text-green-600" />
                    Talent Management Expertise Verified
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    This individual demonstrates significant expertise in talent management:
                  </p>
                  <ul className="space-y-1 text-sm">
                    {contentThemes.talentManagementInsights.specificExpertise?.map((expertise: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="mr-2 h-3 w-3 text-green-600 mt-0.5" />
                        <span>{expertise}</span>
                      </li>
                    ))}
                  </ul>
                  {contentThemes.talentManagementInsights.authorityIndicators?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Authority Indicators:</p>
                      <div className="flex flex-wrap gap-1">
                        {contentThemes.talentManagementInsights.authorityIndicators.map((indicator: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="articles" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Published Articles & Content
            </CardTitle>
            <CardDescription>
              LinkedIn articles and web publications found through research
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* LinkedIn Articles */}
            {linkedInAnalysis?.articles_analysis && linkedInAnalysis.articles_analysis.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">LinkedIn Articles</h4>
                <div className="space-y-3">
                  {linkedInAnalysis.articles_analysis.map((article: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-1">{article.title}</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Published {format(new Date(article.publishedDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {article.content}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <span>{article.engagement.likes} likes</span>
                        <span>{article.engagement.comments} comments</span>
                        <span>{article.engagement.shares} shares</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Web Articles */}
            {articles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Web Articles & Publications</h4>
                <div className="space-y-3">
                  {articles.slice(0, 5).map((article: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-1">{article.title}</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        {article.source} • {format(new Date(article.publishedDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.content}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Relevance: {article.relevanceScore}%
                        </Badge>
                        {article.content?.toLowerCase().includes('talent management') && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            <Target className="mr-1 h-3 w-3" />
                            Talent Management Focus
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {articles.length === 0 && (!linkedInAnalysis?.articles_analysis || linkedInAnalysis.articles_analysis.length === 0) && (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No published articles found yet</p>
                <p className="text-sm text-muted-foreground">Articles will appear here when discovered through web research</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="expertise" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Expertise Evidence & Signals
            </CardTitle>
            <CardDescription>
              Authority indicators and practical experience demonstrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expertise Signals from Posts */}
            {postsAnalysis.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Expertise Signals from Content</h4>
                <div className="space-y-2">
                  {postsAnalysis
                    .filter((post: any) => post.expertiseSignals && post.expertiseSignals.length > 0)
                    .slice(0, 5)
                    .map((post: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          From post on {format(new Date(post.date), 'MMM d, yyyy')}
                        </p>
                        <div className="space-y-1">
                          {post.expertiseSignals.map((signal: any, sigIndex: number) => (
                            <div key={sigIndex} className="flex items-start space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {signal.type}
                              </Badge>
                              <span className="text-sm">{signal.signal}</span>
                              <span className="text-xs text-muted-foreground">
                                ({signal.confidence}% confidence)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Web Research Expertise Signals */}
            {webResearch?.expertise_signals && webResearch.expertise_signals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">External Validation Signals</h4>
                <div className="space-y-2">
                  {webResearch.expertise_signals.slice(0, 5).map((signal: any, index: number) => (
                    <div key={index} className="flex items-start space-x-2 p-2 border rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{signal.signal}</p>
                        <p className="text-xs text-muted-foreground">
                          Source: {signal.source} • Confidence: {signal.confidence}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Experience */}
            {contentThemes?.talentManagementInsights?.practicalExperience && 
             contentThemes.talentManagementInsights.practicalExperience.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Practical Experience Examples</h4>
                <div className="space-y-2">
                  {contentThemes.talentManagementInsights.practicalExperience.map((example: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Award className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{example}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="insights" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Key Insights & Recommendations
            </CardTitle>
            <CardDescription>
              Strategic insights and actionable recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Verification Status */}
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              {profile.intelligenceAssessment.verificationStatus === 'verified' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Expertise Verified</p>
                    <p className="text-xs text-muted-foreground">
                      Multiple sources confirm talent management expertise
                    </p>
                  </div>
                </>
              ) : profile.intelligenceAssessment.verificationStatus === 'likely' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Likely Expert</p>
                    <p className="text-xs text-muted-foreground">
                      Strong indicators of expertise, awaiting full verification
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Unverified</p>
                    <p className="text-xs text-muted-foreground">
                      Limited evidence available for expertise verification
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Key Recommendations */}
            {profile.intelligenceAssessment.recommendations && 
             profile.intelligenceAssessment.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recommendations</h4>
                <ul className="space-y-2">
                  {profile.intelligenceAssessment.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Research Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Research Duration:</span>
                  <span className="ml-2 font-medium">{profile.researchDuration}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Confidence Level:</span>
                  <span className="ml-2 font-medium">{profile.intelligenceAssessment.confidenceLevel}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">LinkedIn Posts Analyzed:</span>
                  <span className="ml-2 font-medium">{totalPosts}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Web Articles Found:</span>
                  <span className="ml-2 font-medium">{articles.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}