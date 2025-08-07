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

export interface ComprehensiveLinkedInProfile {
  connectionId: string
  connectionName: string
  articles: LinkedInArticle[]
  postsAnalysis: PostAnalysis[]
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
      
      // Analyze activity patterns
      const activityPatterns = await this.analyzeActivityPatterns(connection)
      
      // Analyze profile
      const profileAnalysis = await this.analyzeProfile(connection)
      
      // Calculate expertise scores
      const expertiseScores = this.calculateExpertiseScores(articles, postsAnalysis)
      
      // Assess authority
      const authorityAssessment = this.assessAuthority(articles, postsAnalysis, activityPatterns)

      return {
        connectionId: connection.id,
        connectionName: connection.full_name,
        articles,
        postsAnalysis,
        activityPatterns,
        profileAnalysis,
        expertiseScores,
        authorityAssessment,
        analysedAt: new Date().toISOString()
      }

    } catch (error) {
      console.error(`❌ Error in LinkedIn analysis for ${connection.full_name}:`, error)
      throw new Error(`LinkedIn analysis failed: ${error.message}`)
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
    
    return posts.map(post => this.analyzePost(post)).filter(Boolean)
  }

  /**
   * Analyze a single post for expertise signals
   */
  private analyzePost(post: DBConnectionPost): PostAnalysis {
    const content = post.post_text || ''
    
    return {
      post_id: post.id,
      content,
      engagement: post.total_reactions,
      date: post.posted_date || post.created_at,
      topicRelevance: this.calculateTopicRelevance(content),
      expertiseSignals: this.extractAuthoritySignals(content),
      contentType: this.classifyContent(content),
      originalThinking: this.detectOriginalThinking(content),
      practicalValue: this.assessPracticalValue(content)
    }
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
    
    const allKeywords = [...this.TALENT_KEYWORDS, ...this.PEOPLE_DEV_KEYWORDS, ...this.HR_TECH_KEYWORDS]
    
    allKeywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        relevanceScore += 10
      }
    })
    
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
        scores[key] = Math.min(100, Math.round(scores[key]))
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