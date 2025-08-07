/**
 * Web Research Service using Perplexity and Firecrawl MCP integrations
 * Provides comprehensive web-based research for LinkedIn connections
 */

import { DBLinkedInConnection } from './supabase-linkedin'

// Types for research results
export interface WebArticle {
  title: string
  url: string
  content: string
  publishedDate?: string
  source: string
  relevanceScore: number
}

export interface ExpertiseSignal {
  signal: string
  confidence: number
  source: 'content' | 'title' | 'metadata'
  context: string
}

export interface WebResearchResult {
  connectionId: string
  connectionName: string
  searchQuery: string
  articlesFound: WebArticle[]
  expertiseSignals: ExpertiseSignal[]
  talentManagementScore: number
  peopleDevelopmentScore: number
  hrTechnologyScore: number
  leadershipScore: number
  overallRelevanceScore: number
  researchQuality: 'high' | 'medium' | 'low'
  researched_at: string
}

export interface PerplexitySearchResult {
  query: string
  answer: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  relatedQueries: string[]
}

export interface FirecrawlResult {
  url: string
  markdown: string
  title: string
  description?: string
  author?: string
  publishedDate?: string
  error?: string
}

export class WebResearchService {
  private readonly TALENT_MANAGEMENT_KEYWORDS = [
    'talent management', 'talent acquisition', 'talent retention', 'talent development',
    'succession planning', 'performance management', 'employee engagement',
    'workforce planning', 'talent strategy', 'human capital'
  ]

  private readonly PEOPLE_DEVELOPMENT_KEYWORDS = [
    'people development', 'leadership development', 'employee development',
    'skill development', 'career development', 'coaching', 'mentoring',
    'training', 'learning and development', 'upskilling', 'reskilling'
  ]

  private readonly HR_TECHNOLOGY_KEYWORDS = [
    'HR technology', 'HRIS', 'ATS', 'applicant tracking', 'HR analytics',
    'people analytics', 'workforce analytics', 'HR automation', 'HR software',
    'employee experience platform', 'performance management system'
  ]

  /**
   * Research a LinkedIn connection across the web for talent expertise
   */
  async researchConnection(connection: DBLinkedInConnection): Promise<WebResearchResult> {
    console.log(`🔍 Starting web research for ${connection.full_name}`)

    try {
      // Generate comprehensive search queries
      const searchQueries = this.generateSearchQueries(connection)
      
      // Execute Perplexity searches for each area
      const searchResults = await this.executePerplexitySearches(searchQueries)
      
      // Extract article URLs from search results
      const articleUrls = this.extractArticleUrls(searchResults)
      
      // Use Firecrawl to extract full content from articles
      const articles = await this.extractArticleContent(articleUrls)
      
      // Analyze articles for expertise signals
      const expertiseSignals = this.analyzeExpertiseSignals(articles)
      
      // Calculate expertise scores
      const scores = this.calculateExpertiseScores(expertiseSignals, articles)
      
      return {
        connectionId: connection.id,
        connectionName: connection.full_name,
        searchQuery: searchQueries.join(' | '),
        articlesFound: articles,
        expertiseSignals,
        talentManagementScore: scores.talentManagement,
        peopleDevelopmentScore: scores.peopleDevelopment,
        hrTechnologyScore: scores.hrTechnology,
        leadershipScore: scores.leadership,
        overallRelevanceScore: scores.overall,
        researchQuality: this.assessResearchQuality(articles, expertiseSignals),
        researched_at: new Date().toISOString()
      }

    } catch (error) {
      console.error(`❌ Error researching ${connection.full_name}:`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Web research failed: ${errorMessage}`)
    }
  }

  /**
   * Generate targeted search queries for different expertise areas
   */
  private generateSearchQueries(connection: DBLinkedInConnection): string[] {
    const name = connection.full_name
    const company = connection.current_company || ''
    const title = connection.title || connection.headline || ''

    return [
      // Talent management focus
      `"${name}" ${company} talent management OR talent acquisition OR succession planning`,
      
      // People development focus  
      `"${name}" ${company} people development OR leadership development OR employee development`,
      
      // HR technology focus
      `"${name}" ${company} HR technology OR HRIS OR people analytics OR workforce analytics`,
      
      // General thought leadership
      `"${name}" ${company} articles OR blog posts OR conference OR speaking`,
      
      // Industry-specific
      `"${name}" ${title} human resources OR talent OR people operations`
    ]
  }

  /**
   * Execute Perplexity searches using MCP integration
   */
  private async executePerplexitySearches(queries: string[]): Promise<PerplexitySearchResult[]> {
    // Note: This would use the Perplexity MCP integration
    // For now, I'll create the structure that would work with MCP tools
    
    const results: PerplexitySearchResult[] = []
    
    for (const query of queries) {
      try {
        console.log(`🔎 Perplexity search: ${query}`)
        
        // This would be the actual MCP call:
        // const result = await mcp.perplexity.search({ query, max_results: 10 })
        
        // Simulated result structure for now
        const mockResult: PerplexitySearchResult = {
          query,
          answer: `Research results for ${query}`,
          sources: [
            {
              title: `Article about ${query.split(' ')[0]}`,
              url: `https://example.com/article-${Date.now()}`,
              snippet: `Relevant content about talent management...`
            }
          ],
          relatedQueries: [`${query} best practices`, `${query} trends 2024`]
        }
        
        results.push(mockResult)
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Error in Perplexity search for: ${query}`, error)
        continue
      }
    }
    
    return results
  }

  /**
   * Extract unique article URLs from search results
   */
  private extractArticleUrls(searchResults: PerplexitySearchResult[]): string[] {
    const urls = new Set<string>()
    
    searchResults.forEach(result => {
      result.sources.forEach(source => {
        // Filter for likely article URLs
        if (this.isArticleUrl(source.url)) {
          urls.add(source.url)
        }
      })
    })
    
    return Array.from(urls).slice(0, 20) // Limit to top 20 articles
  }

  /**
   * Check if URL is likely to contain an article
   */
  private isArticleUrl(url: string): boolean {
    const articlePatterns = [
      /blog/i, /article/i, /post/i, /news/i, /insights/i,
      /linkedin\.com\/pulse/i, /medium\.com/i, /forbes\.com/i,
      /hbr\.org/i, /shrm\.org/i, /hrexecutive\.com/i
    ]
    
    return articlePatterns.some(pattern => pattern.test(url))
  }

  /**
   * Extract full content from articles using Firecrawl
   */
  private async extractArticleContent(urls: string[]): Promise<WebArticle[]> {
    const articles: WebArticle[] = []
    
    for (const url of urls) {
      try {
        console.log(`🔥 Firecrawl extraction: ${url}`)
        
        // This would be the actual MCP call:
        // const result = await mcp.firecrawl.scrape({ url, formats: ['markdown'] })
        
        // Simulated result for now
        const mockResult: FirecrawlResult = {
          url,
          markdown: `# Article Title\n\nThis is the extracted content from ${url}...\n\nTalent management best practices include...\n\nIn my experience with people development...`,
          title: `Talent Management Article`,
          description: 'Article about talent management',
          publishedDate: new Date().toISOString()
        }
        
        if (!mockResult.error && mockResult.markdown) {
          articles.push({
            title: mockResult.title,
            url: mockResult.url,
            content: mockResult.markdown,
            publishedDate: mockResult.publishedDate,
            source: new URL(url).hostname,
            relevanceScore: this.calculateContentRelevance(mockResult.markdown)
          })
        }
        
        // Rate limiting for Firecrawl
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`Error extracting content from ${url}:`, error)
        continue
      }
    }
    
    return articles.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Calculate how relevant article content is to talent/HR topics
   */
  private calculateContentRelevance(content: string): number {
    const allKeywords = [
      ...this.TALENT_MANAGEMENT_KEYWORDS,
      ...this.PEOPLE_DEVELOPMENT_KEYWORDS,
      ...this.HR_TECHNOLOGY_KEYWORDS
    ]
    
    const contentLower = content.toLowerCase()
    let matchCount = 0
    let totalWords = content.split(/\s+/).length
    
    allKeywords.forEach(keyword => {
      const keywordCount = (contentLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      matchCount += keywordCount
    })
    
    // Calculate relevance score (0-100)
    return Math.min(100, Math.round((matchCount / totalWords) * 1000))
  }

  /**
   * Analyze articles for specific expertise signals
   */
  private analyzeExpertiseSignals(articles: WebArticle[]): ExpertiseSignal[] {
    const signals: ExpertiseSignal[] = []
    
    const authorityPatterns = [
      { pattern: /in my experience/i, signal: 'Personal Experience', confidence: 85 },
      { pattern: /I have (helped|worked with|implemented)/i, signal: 'Direct Implementation', confidence: 90 },
      { pattern: /our (team|company|organization) (achieved|increased|improved)/i, signal: 'Proven Results', confidence: 95 },
      { pattern: /I spoke at|I presented at/i, signal: 'Conference Speaker', confidence: 80 },
      { pattern: /(case study|real example|actual implementation)/i, signal: 'Practical Examples', confidence: 75 },
      { pattern: /\d+% (increase|improvement|reduction)/i, signal: 'Quantified Results', confidence: 85 }
    ]
    
    articles.forEach(article => {
      authorityPatterns.forEach(({ pattern, signal, confidence }) => {
        const matches = article.content.match(pattern)
        if (matches) {
          signals.push({
            signal,
            confidence,
            source: 'content',
            context: this.extractContext(article.content, matches[0])
          })
        }
      })
    })
    
    return signals
  }

  /**
   * Extract context around a matched pattern
   */
  private extractContext(content: string, match: string): string {
    const index = content.toLowerCase().indexOf(match.toLowerCase())
    const start = Math.max(0, index - 100)
    const end = Math.min(content.length, index + match.length + 100)
    return content.slice(start, end).trim() + '...'
  }

  /**
   * Calculate expertise scores based on signals and content
   */
  private calculateExpertiseScores(signals: ExpertiseSignal[], articles: WebArticle[]): {
    talentManagement: number
    peopleDevelopment: number
    hrTechnology: number
    leadership: number
    overall: number
  } {
    const scores = {
      talentManagement: 0,
      peopleDevelopment: 0,
      hrTechnology: 0,
      leadership: 0,
      overall: 0
    }
    
    // Base scores from article relevance
    articles.forEach(article => {
      const content = article.content.toLowerCase()
      
      scores.talentManagement += this.calculateCategoryScore(content, this.TALENT_MANAGEMENT_KEYWORDS)
      scores.peopleDevelopment += this.calculateCategoryScore(content, this.PEOPLE_DEVELOPMENT_KEYWORDS)
      scores.hrTechnology += this.calculateCategoryScore(content, this.HR_TECHNOLOGY_KEYWORDS)
    })
    
    // Boost from authority signals
    signals.forEach(signal => {
      const boost = signal.confidence * 0.1
      scores.talentManagement += boost
      scores.peopleDevelopment += boost
      scores.hrTechnology += boost
      scores.leadership += boost
    })
    
    // Normalize scores to 0-100 range
    Object.keys(scores).forEach(key => {
      if (key !== 'overall') {
        scores[key as keyof typeof scores] = Math.min(100, Math.round(scores[key as keyof typeof scores]))
      }
    })
    
    scores.overall = Math.round(
      (scores.talentManagement + scores.peopleDevelopment + scores.hrTechnology + scores.leadership) / 4
    )
    
    return scores
  }

  /**
   * Calculate score for a specific category based on keyword matching
   */
  private calculateCategoryScore(content: string, keywords: string[]): number {
    let score = 0
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g')
      const matches = content.match(regex) || []
      score += matches.length * 5 // 5 points per keyword match
    })
    
    return score
  }

  /**
   * Assess the overall quality of research results
   */
  private assessResearchQuality(articles: WebArticle[], signals: ExpertiseSignal[]): 'high' | 'medium' | 'low' {
    const highQualityArticles = articles.filter(a => a.relevanceScore > 70).length
    const strongSignals = signals.filter(s => s.confidence > 80).length
    
    if (highQualityArticles >= 3 && strongSignals >= 2) return 'high'
    if (highQualityArticles >= 1 || strongSignals >= 1) return 'medium'
    return 'low'
  }

  /**
   * Research multiple connections in batch
   */
  async researchConnectionsBatch(connections: DBLinkedInConnection[]): Promise<WebResearchResult[]> {
    const results: WebResearchResult[] = []
    
    for (const connection of connections) {
      try {
        const result = await this.researchConnection(connection)
        results.push(result)
        
        // Rate limiting between connections
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error(`Failed to research ${connection.full_name}:`, error)
        continue
      }
    }
    
    return results
  }
}

// Export singleton instance
export const webResearchService = new WebResearchService()