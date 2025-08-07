/**
 * LinkedIn Deep Analysis Service
 * Provides comprehensive analysis of LinkedIn content, articles, posts, and activity patterns
 */

import { DBLinkedInConnection, DBConnectionPost, DBLinkedInPost, supabaseLinkedIn } from './supabase-linkedin'

// Types for LinkedIn analysis
export interface LinkedInArticle {
  title: string
  url: string
  content: string
  publishedDate: string
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  expertise_analysis: ExpertiseAnalysis
}

export interface ExpertiseAnalysis {
  topicRelevance: number
  authoritySignals: AuthoritySignal[]
  expertiseLevel: 'beginner' | 'intermediate' | 'expert'
  originalInsight: boolean
  realExamples: string[]
  specificMetrics: string[]
  frameworksMentioned: string[]
  toolsMentioned: string[]
}

export interface AuthoritySignal {
  type: 'experience' | 'results' | 'methodology' | 'case_study' | 'speaking' | 'teaching'
  signal: string
  confidence: number
  context: string
}

export interface PostAnalysis {
  post_id: string
  content: string
  engagement: number
  date: string
  topicRelevance: number
  expertiseSignals: AuthoritySignal[]
  contentType: 'thought_leadership' | 'case_study' | 'how_to' | 'opinion' | 'news_share' | 'personal'
  originalThinking: boolean
  practicalValue: number
}

export interface ActivityPatternAnalysis {
  commentingBehavior: {
    frequencyOnHRContent: number
    commentQuality: 'high' | 'medium' | 'low'
    expertsEngagedWith: string[]
  }
  sharingBehavior: {
    contentTypes: string[]
    originalVsCurated: {
      original: number
      curated: number
      ratio: number
    }
    topicConsistency: number
  }
  networkAnalysis: {
    hrProfessionalsCount: number
    industryInfluencers: string[]
    relevantCompanies: string[]
  }
}

export interface LinkedInProfileAnalysis {
  careerProgression: {
    hrRoleProgression: number
    companyTypes: string[]
    roleResponsibilities: string[]
    talentFocusAreas: string[]
    yearsInHR: number
  }
  skillsValidation: {
    relevantSkills: string[]
    endorsementQuality: 'high' | 'medium' | 'low'
    skillContentAlignment: number
  }
  credentialsAnalysis: {
    relevantEducation: string[]
    hrCertifications: string[]
    continuousLearning: string[]
  }
  recommendationsInsights: {
    clientRecommendations: number
    peerRecommendations: number
    expertiseAreas: string[]
    specificResults: string[]
  }
}

export interface ContentThemeAnalysis {
  mainTopics: Array<{
    theme: string
    frequency: number
    relevanceScore: number
    examplePosts: string[]
  }>
  postingFrequency: {
    postsPerMonth: number
    mostActiveMonth: string
    consistencyScore: number
  }
  engagementPatterns: {
    averageEngagement: number
    highPerformingPosts: PostAnalysis[]
    engagementTrends: Array<{
      month: string
      avgEngagement: number
    }>
  }
  talentManagementInsights: {
    isExpert: boolean
    specificExpertise: string[]
    authorityIndicators: string[]
    practicalExperience: string[]
  }
}

export interface ComprehensiveLinkedInProfile {
  connectionId: string
  connectionName: string
  articles: LinkedInArticle[]
  postsAnalysis: PostAnalysis[]
  contentThemes: ContentThemeAnalysis
  activityPatterns: ActivityPatternAnalysis
  profileAnalysis: LinkedInProfileAnalysis
  expertiseScores: {
    talentManagement: number
    peopleDevelopment: number
    hrTechnology: number
    leadership: number
    overallExpertise: number
  }
  authorityAssessment: {
    contentConsistency: number
    practicalExperience: number
    industryRecognition: number
    thoughtLeadership: number
    overallAuthority: number
    confidenceLevel: number
  }
  analysedAt: string
}

export class LinkedInDeepAnalysisService {
  private readonly TALENT_KEYWORDS = [
    'talent management', 'talent acquisition', 'talent retention', 'succession planning',
    'performance management', 'employee engagement', 'workforce planning', 'talent strategy'
  ]

  private readonly PEOPLE_DEV_KEYWORDS = [
    'people development', 'leadership development', 'employee development', 'coaching',
    'mentoring', 'training', 'learning and development', 'career development', 'upskilling'
  ]

  private readonly HR_TECH_KEYWORDS = [
    'HR technology', 'HRIS', 'ATS', 'people analytics', 'workforce analytics',
    'HR automation', 'employee experience platform', 'performance management system'
  ]

  private readonly AUTHORITY_PATTERNS = [
    { pattern: /in my (\d+\+?\s?)years? of experience/i, type: 'experience', confidence: 90 },
    { pattern: /I (implemented|led|developed|created)/i, type: 'experience', confidence: 85 },
    { pattern: /(achieved|increased|improved|reduced).+?(\d+%)/i, type: 'results', confidence: 95 },
    { pattern: /case study|real example|actual implementation/i, type: 'case_study', confidence: 80 },
    { pattern: /I spoke at|I presented|keynote|conference speaker/i, type: 'speaking', confidence: 85 },
    { pattern: /framework|methodology|approach I use/i, type: 'methodology', confidence: 75 },
    { pattern: /companies I('ve| have) worked with/i, type: 'experience', confidence: 80 },
    { pattern: /my clients|organizations I('ve| have) helped/i, type: 'experience', confidence: 85 }
  ]

  /**
   * Perform comprehensive LinkedIn analysis for a connection
   */
  async analyzeConnection(connection: DBLinkedInConnection): Promise<ComprehensiveLinkedInProfile> {
    console.log(`🔍 Starting comprehensive LinkedIn analysis for ${connection.full_name}`)

    try {
      // Analyze LinkedIn articles (if available)
      const articles = await this.analyzeLinkedInArticles(connection)
      
      // Analyze LinkedIn posts
      const postsAnalysis = await this.analyzeLinkedInPosts(connection)
      
      // Analyze content themes from posts
      const contentThemes = this.analyzeContentThemes(postsAnalysis)
      
      // Analyze activity patterns
      const activityPatterns = await this.analyzeActivityPatterns(connection)
      
      // Analyze profile
      const profileAnalysis = await this.analyzeProfile(connection)
      
      // Calculate expertise scores
      const expertiseScores = this.calculateExpertiseScores(articles, postsAnalysis)
      
      // Assess authority
      const authorityAssessment = this.assessAuthority(articles, postsAnalysis, activityPatterns)

      console.log(`📋 Content analysis summary for ${connection.full_name}:`)
      console.log(`   - ${postsAnalysis.length} posts analyzed`)
      console.log(`   - ${contentThemes.mainTopics.length} main topics identified`) 
      console.log(`   - Overall expertise: ${expertiseScores.overallExpertise}`)
      console.log(`   - Talent management focus: ${contentThemes.talentManagementInsights.isExpert ? 'Yes' : 'No'}`)

      return {
        connectionId: connection.id,
        connectionName: connection.full_name,
        articles,
        postsAnalysis,
        contentThemes,
        activityPatterns,
        profileAnalysis,
        expertiseScores,
        authorityAssessment,
        analysedAt: new Date().toISOString()
      }

    } catch (error) {
      console.error(`❌ Error in LinkedIn analysis for ${connection.full_name}:`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`LinkedIn analysis failed: ${errorMessage}`)
    }
  }

  /**
   * Analyze LinkedIn articles for expertise and authority
   */
  private async analyzeLinkedInArticles(connection: DBLinkedInConnection): Promise<LinkedInArticle[]> {
    // Note: This would require LinkedIn API integration for articles
    // For now, I'll structure this for future implementation
    
    console.log(`📰 Analyzing LinkedIn articles for ${connection.full_name}`)
    
    // This would fetch articles from LinkedIn API:
    // const articles = await linkedInAPI.getPersonArticles(connection.profile_url)
    
    // Mock structure for now - in real implementation this would fetch and analyze actual articles
    const mockArticles: LinkedInArticle[] = [
      {
        title: "The Future of Talent Management in 2024",
        url: `https://linkedin.com/pulse/article-by-${connection.username}`,
        content: "In my 10+ years of experience in talent management, I've seen organizations struggle with retention...",
        publishedDate: "2024-01-15",
        engagement: { likes: 150, comments: 25, shares: 30 },
        expertise_analysis: {
          topicRelevance: 95,
          authoritySignals: [
            {
              type: 'experience',
              signal: 'in my 10+ years of experience',
              confidence: 90,
              context: 'discussing talent management challenges'
            }
          ],
          expertiseLevel: 'expert',
          originalInsight: true,
          realExamples: ['retention strategies at Fortune 500 company'],
          specificMetrics: ['25% improvement in retention'],
          frameworksMentioned: ['talent lifecycle model'],
          toolsMentioned: ['Workday', 'SuccessFactors']
        }
      }
    ]

    // Analyze each article for expertise signals
    return mockArticles.map(article => ({
      ...article,
      expertise_analysis: this.analyzeContentForExpertise(article.content)
    }))
  }

  /**
   * Analyze LinkedIn posts for patterns and expertise
   */
  private async analyzeLinkedInPosts(connection: DBLinkedInConnection): Promise<PostAnalysis[]> {
    console.log(`📝 Analyzing LinkedIn posts for ${connection.full_name}`)
    
    // Get posts from database
    const posts = await supabaseLinkedIn?.getConnectionPosts(connection.id) || []
    
    console.log(`📊 Found ${posts.length} LinkedIn posts for analysis`)
    
    if (posts.length === 0) {
      console.log('⚠️  No LinkedIn posts found - intelligence report will be limited')
      return []
    }
    
    // Analyze each post for detailed content insights
    const analyses = posts.map(post => this.analyzePost(post)).filter(Boolean)
    
    console.log(`✅ Analyzed ${analyses.length} posts for content themes and expertise`)
    
    return analyses
  }

  /**
   * Analyze a single post for expertise signals
   */
  private analyzePost(post: DBConnectionPost): PostAnalysis {
    const content = post.post_text || ''
    
    // Enhanced logging for content analysis
    if (content.length > 100) {
      console.log(`🔍 Analyzing post from ${post.posted_date}: "${content.substring(0, 100)}..."`)
    }
    
    const analysis = {
      post_id: post.id,
      content,
      engagement: post.total_reactions || 0,
      date: post.posted_date || post.created_at,
      topicRelevance: this.calculateTopicRelevance(content),
      expertiseSignals: this.extractAuthoritySignals(content),
      contentType: this.classifyContent(content),
      originalThinking: this.detectOriginalThinking(content),
      practicalValue: this.assessPracticalValue(content)
    }
    
    // Log analysis insights for debugging
    if (analysis.topicRelevance > 30) {
      console.log(`💡 High relevance post (${analysis.topicRelevance}): ${analysis.contentType}`)
    }
    if (analysis.expertiseSignals.length > 0) {
      console.log(`🎯 Found ${analysis.expertiseSignals.length} expertise signals`)
    }
    
    return analysis
  }

  /**
   * Analyze activity patterns (commenting, sharing, network)
   */
  private async analyzeActivityPatterns(connection: DBLinkedInConnection): Promise<ActivityPatternAnalysis> {
    console.log(`📊 Analyzing activity patterns for ${connection.full_name}`)
    
    // This would require more extensive LinkedIn API integration
    // For now, providing structure based on available data
    
    return {
      commentingBehavior: {
        frequencyOnHRContent: 0, // Would calculate from comment data
        commentQuality: 'medium',
        expertsEngagedWith: []
      },
      sharingBehavior: {
        contentTypes: ['thought_leadership', 'industry_news'],
        originalVsCurated: {
          original: 7,
          curated: 3,
          ratio: 0.7
        },
        topicConsistency: 85
      },
      networkAnalysis: {
        hrProfessionalsCount: 0, // Would analyze connections
        industryInfluencers: [],
        relevantCompanies: [connection.current_company || ''].filter(Boolean)
      }
    }
  }

  /**
   * Analyze profile for career progression and credentials
   */
  private async analyzeProfile(connection: DBLinkedInConnection): Promise<LinkedInProfileAnalysis> {
    console.log(`👤 Analyzing profile for ${connection.full_name}`)
    
    const headline = connection.headline || ''
    const title = connection.title || ''
    
    return {
      careerProgression: {
        hrRoleProgression: this.assessHRRoleProgression(headline, title),
        companyTypes: [connection.current_company || ''].filter(Boolean),
        roleResponsibilities: this.extractResponsibilities(headline, title),
        talentFocusAreas: this.identifyTalentAreas(headline, title),
        yearsInHR: this.estimateYearsInHR(headline, title)
      },
      skillsValidation: {
        relevantSkills: this.extractRelevantSkills(headline, title),
        endorsementQuality: 'medium', // Would analyze actual endorsements
        skillContentAlignment: 75
      },
      credentialsAnalysis: {
        relevantEducation: [],
        hrCertifications: this.extractCertifications(headline, title),
        continuousLearning: []
      },
      recommendationsInsights: {
        clientRecommendations: 0,
        peerRecommendations: 0,
        expertiseAreas: this.identifyTalentAreas(headline, title),
        specificResults: []
      }
    }
  }

  /**
   * Analyze content for expertise signals and authority indicators
   */
  private analyzeContentForExpertise(content: string): ExpertiseAnalysis {
    return {
      topicRelevance: this.calculateTopicRelevance(content),
      authoritySignals: this.extractAuthoritySignals(content),
      expertiseLevel: this.assessExpertiseLevel(content),
      originalInsight: this.detectOriginalThinking(content),
      realExamples: this.extractRealExamples(content),
      specificMetrics: this.extractMetrics(content),
      frameworksMentioned: this.extractFrameworks(content),
      toolsMentioned: this.extractTools(content)
    }
  }

  /**
   * Calculate topic relevance score (0-100)
   */
  private calculateTopicRelevance(content: string): number {
    const contentLower = content.toLowerCase()
    let relevanceScore = 0
    let foundKeywords: string[] = []
    
    // Check talent management keywords (highest weight)
    this.TALENT_KEYWORDS.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        relevanceScore += 15
        foundKeywords.push(keyword)
      }
    })
    
    // Check people development keywords
    this.PEOPLE_DEV_KEYWORDS.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        relevanceScore += 12
        foundKeywords.push(keyword)
      }
    })
    
    // Check HR technology keywords
    this.HR_TECH_KEYWORDS.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        relevanceScore += 10
        foundKeywords.push(keyword)
      }
    })
    
    // Bonus for multiple keyword categories
    const categories = [
      this.TALENT_KEYWORDS.some(k => contentLower.includes(k.toLowerCase())),
      this.PEOPLE_DEV_KEYWORDS.some(k => contentLower.includes(k.toLowerCase())),
      this.HR_TECH_KEYWORDS.some(k => contentLower.includes(k.toLowerCase()))
    ].filter(Boolean).length
    
    if (categories >= 2) relevanceScore += 10
    if (categories === 3) relevanceScore += 15
    
    // Log high-relevance content for debugging
    if (relevanceScore > 50 && foundKeywords.length > 0) {
      console.log(`🔥 High relevance content (${relevanceScore}): found ${foundKeywords.join(', ')}`)
    }
    
    return Math.min(100, relevanceScore)
  }

  /**
   * Extract authority signals from content
   */
  private extractAuthoritySignals(content: string): AuthoritySignal[] {
    const signals: AuthoritySignal[] = []
    
    this.AUTHORITY_PATTERNS.forEach(({ pattern, type, confidence }) => {
      const matches = content.match(pattern)
      if (matches) {
        signals.push({
          type: type as AuthoritySignal['type'],
          signal: matches[0],
          confidence,
          context: this.extractContext(content, matches[0])
        })
      }
    })
    
    return signals
  }

  /**
   * Extract context around a matched signal
   */
  private extractContext(content: string, match: string): string {
    const index = content.toLowerCase().indexOf(match.toLowerCase())
    const start = Math.max(0, index - 50)
    const end = Math.min(content.length, index + match.length + 50)
    return content.slice(start, end).trim()
  }

  /**
   * Assess expertise level based on content sophistication
   */
  private assessExpertiseLevel(content: string): 'beginner' | 'intermediate' | 'expert' {
    const expertIndicators = [
      /framework|methodology/i,
      /case study|real example/i,
      /\d+%.*improvement/i,
      /in my.*years of experience/i,
      /companies I.*worked with/i
    ]
    
    const matches = expertIndicators.filter(pattern => pattern.test(content)).length
    
    if (matches >= 3) return 'expert'
    if (matches >= 1) return 'intermediate'
    return 'beginner'
  }

  /**
   * Detect original thinking vs resharing
   */
  private detectOriginalThinking(content: string): boolean {
    const originalityIndicators = [
      /in my opinion/i, /I believe/i, /my approach/i, /I've found/i,
      /here's what I learned/i, /my experience shows/i
    ]
    
    return originalityIndicators.some(pattern => pattern.test(content))
  }

  /**
   * Extract real examples and case studies
   */
  private extractRealExamples(content: string): string[] {
    const examples: string[] = []
    const examplePatterns = [
      /for example[^.]{10,100}/i,
      /case study[^.]{10,100}/i,
      /real example[^.]{10,100}/i,
      /at [A-Z][^,]{3,30}/i
    ]
    
    examplePatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        examples.push(matches[0].trim())
      }
    })
    
    return examples
  }

  /**
   * Extract specific metrics and numbers
   */
  private extractMetrics(content: string): string[] {
    const metrics: string[] = []
    const metricPattern = /\d+%\s*(increase|improvement|reduction|growth|decrease)/gi
    
    const matches = content.match(metricPattern)
    if (matches) {
      metrics.push(...matches)
    }
    
    return metrics
  }

  /**
   * Extract frameworks and methodologies mentioned
   */
  private extractFrameworks(content: string): string[] {
    const frameworks = [
      'OKRs', 'KPIs', 'SMART goals', '9-box grid', 'competency model',
      'succession planning', 'talent pipeline', 'employee journey mapping',
      'performance management framework', 'engagement survey'
    ]
    
    const contentLower = content.toLowerCase()
    return frameworks.filter(framework => 
      contentLower.includes(framework.toLowerCase())
    )
  }

  /**
   * Extract HR tools and technologies mentioned
   */
  private extractTools(content: string): string[] {
    const tools = [
      'Workday', 'SuccessFactors', 'BambooHR', 'ADP', 'Cornerstone OnDemand',
      'Greenhouse', 'Lever', 'Workable', 'Culture Amp', 'Glint', 'Lattice',
      'LinkedIn Talent Insights', 'Tableau', 'Power BI'
    ]
    
    const contentLower = content.toLowerCase()
    return tools.filter(tool => 
      contentLower.includes(tool.toLowerCase())
    )
  }

  /**
   * Classify content type
   */
  private classifyContent(content: string): PostAnalysis['contentType'] {
    if (/case study|real example/i.test(content)) return 'case_study'
    if (/how to|steps to|guide to/i.test(content)) return 'how_to'
    if (/I think|in my opinion|I believe/i.test(content)) return 'opinion'
    if (/check out|great article|interesting read/i.test(content)) return 'news_share'
    if (/framework|strategy|approach/i.test(content)) return 'thought_leadership'
    return 'personal'
  }

  /**
   * Assess practical value of content
   */
  private assessPracticalValue(content: string): number {
    let score = 0
    
    // Actionable advice
    if (/how to|steps|tips|advice/i.test(content)) score += 25
    
    // Real examples
    if (/example|case study/i.test(content)) score += 25
    
    // Specific metrics
    if (/\d+%/i.test(content)) score += 25
    
    // Tools or frameworks
    if (this.extractFrameworks(content).length > 0 || this.extractTools(content).length > 0) score += 25
    
    return score
  }

  /**
   * Calculate expertise scores across different areas
   */
  private calculateExpertiseScores(
    articles: LinkedInArticle[], 
    posts: PostAnalysis[]
  ): ComprehensiveLinkedInProfile['expertiseScores'] {
    const scores = {
      talentManagement: 0,
      peopleDevelopment: 0,
      hrTechnology: 0,
      leadership: 0,
      overallExpertise: 0
    }
    
    // Score from articles
    articles.forEach(article => {
      const content = article.content.toLowerCase()
      scores.talentManagement += this.scoreContentForCategory(content, this.TALENT_KEYWORDS)
      scores.peopleDevelopment += this.scoreContentForCategory(content, this.PEOPLE_DEV_KEYWORDS)
      scores.hrTechnology += this.scoreContentForCategory(content, this.HR_TECH_KEYWORDS)
    })
    
    // Score from posts
    posts.forEach(post => {
      const content = post.content.toLowerCase()
      scores.talentManagement += this.scoreContentForCategory(content, this.TALENT_KEYWORDS) * 0.3
      scores.peopleDevelopment += this.scoreContentForCategory(content, this.PEOPLE_DEV_KEYWORDS) * 0.3
      scores.hrTechnology += this.scoreContentForCategory(content, this.HR_TECH_KEYWORDS) * 0.3
    })
    
    // Normalize scores
    Object.keys(scores).forEach(key => {
      if (key !== 'overallExpertise') {
        scores[key as keyof typeof scores] = Math.min(100, Math.round(scores[key as keyof typeof scores]))
      }
    })
    
    scores.overallExpertise = Math.round(
      (scores.talentManagement + scores.peopleDevelopment + scores.hrTechnology + scores.leadership) / 4
    )
    
    return scores
  }

  /**
   * Score content for a specific category
   */
  private scoreContentForCategory(content: string, keywords: string[]): number {
    let score = 0
    keywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        score += 10
      }
    })
    return score
  }

  /**
   * Assess overall authority based on all signals
   */
  private assessAuthority(
    articles: LinkedInArticle[],
    posts: PostAnalysis[],
    activity: ActivityPatternAnalysis
  ): ComprehensiveLinkedInProfile['authorityAssessment'] {
    let contentConsistency = 0
    let practicalExperience = 0
    let industryRecognition = 0
    let thoughtLeadership = 0
    
    // Analyze content consistency
    const totalContent = articles.length + posts.length
    const relevantContent = articles.filter(a => a.expertise_analysis.topicRelevance > 70).length +
                           posts.filter(p => p.topicRelevance > 70).length
    
    contentConsistency = totalContent > 0 ? Math.round((relevantContent / totalContent) * 100) : 0
    
    // Assess practical experience from authority signals
    const allSignals = [
      ...articles.flatMap(a => a.expertise_analysis.authoritySignals),
      ...posts.flatMap(p => p.expertiseSignals)
    ]
    
    const experienceSignals = allSignals.filter(s => s.type === 'experience' || s.type === 'results')
    practicalExperience = Math.min(100, experienceSignals.length * 15)
    
    // Industry recognition from engagement and speaking
    const avgEngagement = posts.length > 0 
      ? posts.reduce((sum, p) => sum + p.engagement, 0) / posts.length 
      : 0
    const speakingSignals = allSignals.filter(s => s.type === 'speaking').length
    
    industryRecognition = Math.min(100, Math.round(avgEngagement / 10) + speakingSignals * 20)
    
    // Thought leadership from original content and frameworks
    const originalPosts = posts.filter(p => p.originalThinking).length
    const frameworkMentions = articles.reduce((sum, a) => sum + a.expertise_analysis.frameworksMentioned.length, 0)
    
    thoughtLeadership = Math.min(100, originalPosts * 10 + frameworkMentions * 5)
    
    const overallAuthority = Math.round(
      (contentConsistency + practicalExperience + industryRecognition + thoughtLeadership) / 4
    )
    
    // Confidence based on amount and quality of data
    let confidenceLevel = 50 // Base confidence
    if (totalContent >= 10) confidenceLevel += 20
    if (allSignals.length >= 5) confidenceLevel += 20
    if (articles.length >= 3) confidenceLevel += 10
    
    return {
      contentConsistency,
      practicalExperience,
      industryRecognition,
      thoughtLeadership,
      overallAuthority,
      confidenceLevel: Math.min(100, confidenceLevel)
    }
  }

  /**
   * Analyze content themes and patterns from posts analysis
   */
  private analyzeContentThemes(postsAnalysis: PostAnalysis[]): ContentThemeAnalysis {
    console.log(`🎨 Analyzing content themes from ${postsAnalysis.length} posts`)
    
    if (postsAnalysis.length === 0) {
      return this.getEmptyContentThemes()
    }

    // Extract main topics from all posts
    const topicMap = new Map<string, { frequency: number, relevanceScore: number, examples: string[] }>()
    
    postsAnalysis.forEach(post => {
      const content = post.content.toLowerCase()
      
      // Check for talent management themes
      this.TALENT_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          const existing = topicMap.get(keyword) || { frequency: 0, relevanceScore: 0, examples: [] }
          existing.frequency += 1
          existing.relevanceScore += post.topicRelevance
          if (existing.examples.length < 3) {
            existing.examples.push(post.content.substring(0, 100) + '...')
          }
          topicMap.set(keyword, existing)
        }
      })

      // Check for people development themes  
      this.PEOPLE_DEV_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          const existing = topicMap.get(keyword) || { frequency: 0, relevanceScore: 0, examples: [] }
          existing.frequency += 1
          existing.relevanceScore += post.topicRelevance
          if (existing.examples.length < 3) {
            existing.examples.push(post.content.substring(0, 100) + '...')
          }
          topicMap.set(keyword, existing)
        }
      })

      // Check for HR tech themes
      this.HR_TECH_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          const existing = topicMap.get(keyword) || { frequency: 0, relevanceScore: 0, examples: [] }
          existing.frequency += 1
          existing.relevanceScore += post.topicRelevance
          if (existing.examples.length < 3) {
            existing.examples.push(post.content.substring(0, 100) + '...')
          }
          topicMap.set(keyword, existing)
        }
      })
    })

    // Convert to sorted main topics
    const mainTopics = Array.from(topicMap.entries())
      .map(([theme, data]) => ({
        theme,
        frequency: data.frequency,
        relevanceScore: Math.round(data.relevanceScore / data.frequency),
        examplePosts: data.examples
      }))
      .filter(topic => topic.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10) // Top 10 themes

    // Analyze posting frequency
    const postDates = postsAnalysis.map(p => new Date(p.date)).filter(d => !isNaN(d.getTime()))
    const postingFrequency = this.analyzePostingFrequency(postDates)

    // Analyze engagement patterns
    const engagementPatterns = this.analyzeEngagementPatterns(postsAnalysis)

    // Analyze talent management insights
    const talentManagementInsights = this.analyzeTalentManagementInsights(postsAnalysis, topicMap)

    console.log(`✅ Found ${mainTopics.length} main themes, posting ${postingFrequency.postsPerMonth} times/month`)

    return {
      mainTopics,
      postingFrequency,
      engagementPatterns,
      talentManagementInsights
    }
  }

  /**
   * Get empty content themes structure
   */
  private getEmptyContentThemes(): ContentThemeAnalysis {
    return {
      mainTopics: [],
      postingFrequency: {
        postsPerMonth: 0,
        mostActiveMonth: '',
        consistencyScore: 0
      },
      engagementPatterns: {
        averageEngagement: 0,
        highPerformingPosts: [],
        engagementTrends: []
      },
      talentManagementInsights: {
        isExpert: false,
        specificExpertise: [],
        authorityIndicators: [],
        practicalExperience: []
      }
    }
  }

  /**
   * Analyze posting frequency patterns
   */
  private analyzePostingFrequency(postDates: Date[]): ContentThemeAnalysis['postingFrequency'] {
    if (postDates.length === 0) {
      return { postsPerMonth: 0, mostActiveMonth: '', consistencyScore: 0 }
    }

    // Calculate posts per month
    const monthsSpan = postDates.length > 1 
      ? Math.max(1, (postDates[0].getTime() - postDates[postDates.length - 1].getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 1
    const postsPerMonth = Math.round(postDates.length / monthsSpan * 10) / 10

    // Find most active month
    const monthCounts = new Map<string, number>()
    postDates.forEach(date => {
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1)
    })
    
    const mostActiveMonth = Array.from(monthCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

    // Calculate consistency score (0-100)
    const monthlyVariance = Array.from(monthCounts.values())
    const avgMonthly = monthlyVariance.reduce((sum, count) => sum + count, 0) / monthlyVariance.length
    const variance = monthlyVariance.reduce((sum, count) => sum + Math.pow(count - avgMonthly, 2), 0) / monthlyVariance.length
    const consistencyScore = Math.max(0, Math.round(100 - (Math.sqrt(variance) / avgMonthly) * 100))

    return { postsPerMonth, mostActiveMonth, consistencyScore }
  }

  /**
   * Analyze engagement patterns
   */
  private analyzeEngagementPatterns(postsAnalysis: PostAnalysis[]): ContentThemeAnalysis['engagementPatterns'] {
    if (postsAnalysis.length === 0) {
      return { averageEngagement: 0, highPerformingPosts: [], engagementTrends: [] }
    }

    const averageEngagement = Math.round(
      postsAnalysis.reduce((sum, post) => sum + post.engagement, 0) / postsAnalysis.length
    )

    const highPerformingPosts = postsAnalysis
      .filter(post => post.engagement > averageEngagement * 1.5)
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)

    // Simple engagement trends (would be more sophisticated with more data)
    const engagementTrends = postsAnalysis
      .map(post => ({
        month: new Date(post.date).toISOString().substring(0, 7),
        engagement: post.engagement
      }))
      .reduce((acc, { month, engagement }) => {
        const existing = acc.find(item => item.month === month)
        if (existing) {
          existing.totalEngagement += engagement
          existing.count += 1
        } else {
          acc.push({ month, totalEngagement: engagement, count: 1 })
        }
        return acc
      }, [] as Array<{ month: string, totalEngagement: number, count: number }>)
      .map(({ month, totalEngagement, count }) => ({
        month,
        avgEngagement: Math.round(totalEngagement / count)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return { averageEngagement, highPerformingPosts, engagementTrends }
  }

  /**
   * Analyze talent management specific insights
   */
  private analyzeTalentManagementInsights(
    postsAnalysis: PostAnalysis[], 
    topicMap: Map<string, { frequency: number, relevanceScore: number, examples: string[] }>
  ): ContentThemeAnalysis['talentManagementInsights'] {
    
    // Check if person is a talent management expert
    const talentPosts = postsAnalysis.filter(post => post.topicRelevance > 50)
    const experienceSignals = postsAnalysis.flatMap(post => post.expertiseSignals)
    const isExpert = talentPosts.length >= 3 && experienceSignals.length >= 2

    // Extract specific expertise areas
    const specificExpertise: string[] = []
    Array.from(topicMap.entries())
      .filter(([_, data]) => data.frequency >= 2)
      .forEach(([keyword, _]) => {
        if (this.TALENT_KEYWORDS.includes(keyword)) {
          specificExpertise.push(keyword)
        }
      })

    // Extract authority indicators
    const authorityIndicators = experienceSignals
      .filter(signal => signal.confidence > 80)
      .map(signal => signal.signal)
      .slice(0, 5)

    // Extract practical experience examples
    const practicalExperience = postsAnalysis
      .flatMap(post => this.extractRealExamples(post.content))
      .slice(0, 5)

    return {
      isExpert,
      specificExpertise,
      authorityIndicators,
      practicalExperience
    }
  }

  // Helper methods for profile analysis
  private assessHRRoleProgression(headline: string, title: string): number {
    const hrRoles = ['HR', 'Human Resources', 'Talent', 'People', 'CHRO', 'Director', 'VP']
    const seniorTerms = ['Director', 'VP', 'Chief', 'Head of', 'Senior']
    
    const content = `${headline} ${title}`.toLowerCase()
    const hasHRRole = hrRoles.some(role => content.includes(role.toLowerCase()))
    const hasSeniorRole = seniorTerms.some(term => content.includes(term.toLowerCase()))
    
    if (hasHRRole && hasSeniorRole) return 90
    if (hasHRRole) return 70
    return 30
  }

  private extractResponsibilities(headline: string, title: string): string[] {
    const responsibilities: string[] = []
    const content = `${headline} ${title}`.toLowerCase()
    
    const rolePatterns = [
      'talent acquisition', 'talent management', 'performance management',
      'employee development', 'succession planning', 'compensation',
      'benefits', 'employee relations', 'organizational development'
    ]
    
    rolePatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        responsibilities.push(pattern)
      }
    })
    
    return responsibilities
  }

  private identifyTalentAreas(headline: string, title: string): string[] {
    const content = `${headline} ${title}`.toLowerCase()
    const areas: string[] = []
    
    if (content.includes('talent')) areas.push('talent management')
    if (content.includes('performance')) areas.push('performance management')
    if (content.includes('development')) areas.push('people development')
    if (content.includes('leadership')) areas.push('leadership development')
    if (content.includes('analytics')) areas.push('people analytics')
    
    return areas
  }

  private estimateYearsInHR(headline: string, title: string): number {
    const content = `${headline} ${title}`.toLowerCase()
    const yearMatches = content.match(/(\d+)\+?\s*years?/i)
    
    if (yearMatches) {
      return parseInt(yearMatches[1])
    }
    
    // Estimate based on seniority
    if (content.includes('senior') || content.includes('director')) return 8
    if (content.includes('manager') || content.includes('lead')) return 5
    return 3
  }

  private extractRelevantSkills(headline: string, title: string): string[] {
    const content = `${headline} ${title}`.toLowerCase()
    const skills = [
      'talent acquisition', 'performance management', 'employee engagement',
      'succession planning', 'compensation', 'benefits', 'HRIS', 'analytics'
    ]
    
    return skills.filter(skill => content.includes(skill))
  }

  private extractCertifications(headline: string, title: string): string[] {
    const content = `${headline} ${title}`.toLowerCase()
    const certifications = ['SHRM-CP', 'SHRM-SCP', 'PHR', 'SPHR', 'GPHR']
    
    return certifications.filter(cert => content.includes(cert.toLowerCase()))
  }
}

// Export singleton instance
export const linkedInDeepAnalysisService = new LinkedInDeepAnalysisService()