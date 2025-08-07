/**
 * Connection Intelligence Service
 * Combines web research and LinkedIn deep analysis for comprehensive connection intelligence
 */

import { DBLinkedInConnection, supabaseLinkedIn } from './supabase-linkedin'
import { webResearchService, WebResearchResult } from './web-research-service'
import { linkedInDeepAnalysisService, ComprehensiveLinkedInProfile } from './linkedin-deep-analysis'

// Combined intelligence profile
export interface ConnectionIntelligenceProfile {
  // Basic info
  connectionId: string
  connectionName: string
  company: string
  title: string
  profileUrl: string
  
  // Research results
  webResearch: WebResearchResult
  linkedInAnalysis: ComprehensiveLinkedInProfile
  
  // Unified scores
  unifiedScores: {
    talentManagement: number
    peopleDevelopment: number
    hrTechnology: number
    leadership: number
    overallExpertise: number
    practicalExperience: number
    thoughtLeadership: number
    industryRecognition: number
  }
  
  // Intelligence assessment
  intelligenceAssessment: {
    dataQuality: 'high' | 'medium' | 'low'
    confidenceLevel: number
    verificationStatus: 'verified' | 'likely' | 'unverified'
    expertiseVerification: ExpertiseVerification[]
    redFlags: string[]
    strengths: string[]
    recommendations: string[]
  }
  
  // Metadata
  researchedAt: string
  lastUpdatedAt: string
  researchDuration: number // in seconds
}

export interface ExpertiseVerification {
  claim: string
  webEvidence: string[]
  linkedInEvidence: string[]
  confidence: number
  verified: boolean
}

export interface BatchResearchRequest {
  connectionIds: string[]
  priorityOrder: 'expertise_potential' | 'engagement_level' | 'company_relevance' | 'random'
  maxConcurrency: number
}

export interface BatchResearchResult {
  requestId: string
  totalConnections: number
  completed: number
  failed: number
  inProgress: number
  results: ConnectionIntelligenceProfile[]
  errors: Array<{
    connectionId: string
    error: string
  }>
  summary: {
    highValueProspects: number
    averageExpertiseScore: number
    topExpertiseAreas: string[]
    researchQualityDistribution: {
      high: number
      medium: number
      low: number
    }
  }
}

export class ConnectionIntelligenceService {
  
  /**
   * Generate complete intelligence profile for a connection
   */
  async generateIntelligenceProfile(connectionId: string): Promise<ConnectionIntelligenceProfile> {
    const startTime = Date.now()
    
    console.log(`🧠 Generating intelligence profile for connection: ${connectionId}`)
    
    try {
      // Get connection data
      const connection = await this.getConnectionById(connectionId)
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`)
      }
      
      // Run web research and LinkedIn analysis in parallel
      const [webResearch, linkedInAnalysis] = await Promise.all([
        webResearchService.researchConnection(connection),
        linkedInDeepAnalysisService.analyzeConnection(connection)
      ])
      
      // Combine and score the results
      const unifiedScores = this.calculateUnifiedScores(webResearch, linkedInAnalysis)
      
      // Generate intelligence assessment
      const intelligenceAssessment = this.generateIntelligenceAssessment(
        webResearch, 
        linkedInAnalysis,
        unifiedScores
      )
      
      const researchDuration = Math.round((Date.now() - startTime) / 1000)
      
      const profile: ConnectionIntelligenceProfile = {
        connectionId: connection.id,
        connectionName: connection.full_name,
        company: connection.current_company || 'Unknown',
        title: connection.title || connection.headline || 'Unknown',
        profileUrl: `https://linkedin.com/in/${connection.username}`,
        webResearch,
        linkedInAnalysis,
        unifiedScores,
        intelligenceAssessment,
        researchedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        researchDuration
      }
      
      // Store the intelligence profile
      await this.storeIntelligenceProfile(profile)
      
      console.log(`✅ Intelligence profile completed for ${connection.full_name} in ${researchDuration}s`)
      
      return profile
      
    } catch (error) {
      console.error(`❌ Error generating intelligence profile for ${connectionId}:`, error)
      throw new Error(`Intelligence profile generation failed: ${error.message}`)
    }
  }

  /**
   * Calculate unified expertise scores combining web and LinkedIn data
   */
  private calculateUnifiedScores(
    webResearch: WebResearchResult, 
    linkedInAnalysis: ComprehensiveLinkedInProfile
  ): ConnectionIntelligenceProfile['unifiedScores'] {
    // Weight factors - web research gets more weight for external validation
    const webWeight = 0.6
    const linkedInWeight = 0.4
    
    const talentManagement = Math.round(
      (webResearch.talentManagementScore * webWeight) + 
      (linkedInAnalysis.expertiseScores.talentManagement * linkedInWeight)
    )
    
    const peopleDevelopment = Math.round(
      (webResearch.peopleDevelopmentScore * webWeight) + 
      (linkedInAnalysis.expertiseScores.peopleDevelopment * linkedInWeight)
    )
    
    const hrTechnology = Math.round(
      (webResearch.hrTechnologyScore * webWeight) + 
      (linkedInAnalysis.expertiseScores.hrTechnology * linkedInWeight)
    )
    
    const leadership = Math.round(
      (webResearch.leadershipScore * webWeight) + 
      (linkedInAnalysis.expertiseScores.leadership * linkedInWeight)
    )
    
    const overallExpertise = Math.round(
      (webResearch.overallRelevanceScore * webWeight) + 
      (linkedInAnalysis.expertiseScores.overallExpertise * linkedInWeight)
    )
    
    // These come primarily from LinkedIn analysis
    const practicalExperience = linkedInAnalysis.authorityAssessment.practicalExperience
    const thoughtLeadership = linkedInAnalysis.authorityAssessment.thoughtLeadership
    const industryRecognition = linkedInAnalysis.authorityAssessment.industryRecognition
    
    return {
      talentManagement,
      peopleDevelopment,
      hrTechnology,
      leadership,
      overallExpertise,
      practicalExperience,
      thoughtLeadership,
      industryRecognition
    }
  }

  /**
   * Generate comprehensive intelligence assessment
   */
  private generateIntelligenceAssessment(
    webResearch: WebResearchResult,
    linkedInAnalysis: ComprehensiveLinkedInProfile,
    scores: ConnectionIntelligenceProfile['unifiedScores']
  ): ConnectionIntelligenceProfile['intelligenceAssessment'] {
    
    // Assess data quality
    const dataQuality = this.assessDataQuality(webResearch, linkedInAnalysis)
    
    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(webResearch, linkedInAnalysis, dataQuality)
    
    // Verify expertise claims
    const expertiseVerification = this.verifyExpertiseClaims(webResearch, linkedInAnalysis)
    
    // Identify red flags and strengths
    const redFlags = this.identifyRedFlags(webResearch, linkedInAnalysis)
    const strengths = this.identifyStrengths(webResearch, linkedInAnalysis, scores)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(webResearch, linkedInAnalysis, scores)
    
    // Determine verification status
    const verificationStatus = this.determineVerificationStatus(
      expertiseVerification, 
      confidenceLevel, 
      redFlags.length
    )
    
    return {
      dataQuality,
      confidenceLevel,
      verificationStatus,
      expertiseVerification,
      redFlags,
      strengths,
      recommendations
    }
  }

  /**
   * Assess the quality of research data collected
   */
  private assessDataQuality(
    webResearch: WebResearchResult,
    linkedInAnalysis: ComprehensiveLinkedInProfile
  ): 'high' | 'medium' | 'low' {
    let score = 0
    
    // Web research quality indicators
    if (webResearch.articlesFound.length >= 5) score += 25
    if (webResearch.expertiseSignals.length >= 3) score += 25
    if (webResearch.researchQuality === 'high') score += 15
    
    // LinkedIn analysis quality indicators
    if (linkedInAnalysis.articles.length >= 2) score += 20
    if (linkedInAnalysis.postsAnalysis.length >= 10) score += 15
    
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  /**
   * Calculate overall confidence in the intelligence assessment
   */
  private calculateConfidenceLevel(
    webResearch: WebResearchResult,
    linkedInAnalysis: ComprehensiveLinkedInProfile,
    dataQuality: 'high' | 'medium' | 'low'
  ): number {
    let confidence = 50 // Base confidence
    
    // Data quality boost
    if (dataQuality === 'high') confidence += 25
    else if (dataQuality === 'medium') confidence += 15
    
    // Web research confidence
    const highConfidenceSignals = webResearch.expertiseSignals.filter(s => s.confidence > 80).length
    confidence += Math.min(15, highConfidenceSignals * 3)
    
    // LinkedIn analysis confidence
    confidence += linkedInAnalysis.authorityAssessment.confidenceLevel * 0.2
    
    // Cross-validation bonus
    const webHasExpertise = webResearch.overallRelevanceScore > 60
    const linkedInHasExpertise = linkedInAnalysis.expertiseScores.overallExpertise > 60
    if (webHasExpertise && linkedInHasExpertise) confidence += 10
    
    return Math.min(100, Math.round(confidence))
  }

  /**
   * Verify specific expertise claims against evidence
   */
  private verifyExpertiseClaims(
    webResearch: WebResearchResult,
    linkedInAnalysis: ComprehensiveLinkedInProfile
  ): ExpertiseVerification[] {
    const verifications: ExpertiseVerification[] = []
    
    // Check talent management claim
    if (linkedInAnalysis.expertiseScores.talentManagement > 50 || webResearch.talentManagementScore > 50) {
      const webEvidence = webResearch.expertiseSignals
        .filter(s => s.signal.toLowerCase().includes('talent'))
        .map(s => s.signal)
      
      const linkedInEvidence = linkedInAnalysis.postsAnalysis
        .filter(p => p.content.toLowerCase().includes('talent'))
        .map(p => p.content.substring(0, 100) + '...')
        .slice(0, 3)
      
      const confidence = this.calculateVerificationConfidence(webEvidence, linkedInEvidence)
      
      verifications.push({
        claim: 'Talent Management Expertise',
        webEvidence,
        linkedInEvidence,
        confidence,
        verified: confidence > 70
      })
    }
    
    // Check people development claim
    if (linkedInAnalysis.expertiseScores.peopleDevelopment > 50 || webResearch.peopleDevelopmentScore > 50) {
      const webEvidence = webResearch.expertiseSignals
        .filter(s => s.signal.toLowerCase().includes('development') || s.signal.toLowerCase().includes('coaching'))
        .map(s => s.signal)
      
      const linkedInEvidence = linkedInAnalysis.postsAnalysis
        .filter(p => p.content.toLowerCase().includes('development') || p.content.toLowerCase().includes('coaching'))
        .map(p => p.content.substring(0, 100) + '...')
        .slice(0, 3)
      
      const confidence = this.calculateVerificationConfidence(webEvidence, linkedInEvidence)
      
      verifications.push({
        claim: 'People Development Expertise',
        webEvidence,
        linkedInEvidence,
        confidence,
        verified: confidence > 70
      })
    }
    
    return verifications
  }

  /**
   * Calculate confidence level for expertise verification
   */
  private calculateVerificationConfidence(webEvidence: string[], linkedInEvidence: string[]): number {
    let confidence = 0
    
    // Web evidence weight (external validation is stronger)
    confidence += Math.min(60, webEvidence.length * 20)
    
    // LinkedIn evidence weight
    confidence += Math.min(40, linkedInEvidence.length * 10)
    
    return Math.min(100, confidence)
  }

  /**
   * Identify red flags that might indicate inflated expertise claims
   */
  private identifyRedFlags(
    webResearch: WebResearchResult,
    linkedInAnalysis: ComprehensiveLinkedInProfile
  ): string[] {
    const redFlags: string[] = []
    
    // No external validation
    if (webResearch.articlesFound.length === 0) {
      redFlags.push('No external articles or thought leadership found')
    }
    
    // LinkedIn content inconsistency
    if (linkedInAnalysis.authorityAssessment.contentConsistency < 50) {
      redFlags.push('Inconsistent LinkedIn content focus')
    }
    
    // Claims without evidence
    const hasStrongClaims = linkedInAnalysis.expertiseScores.overallExpertise > 80
    const hasWeakEvidence = webResearch.expertiseSignals.length < 2
    if (hasStrongClaims && hasWeakEvidence) {
      redFlags.push('Strong expertise claims with limited supporting evidence')
    }
    
    // Generic content
    const originalContent = linkedInAnalysis.postsAnalysis.filter(p => p.originalThinking).length
    const totalContent = linkedInAnalysis.postsAnalysis.length
    if (totalContent > 5 && originalContent / totalContent < 0.3) {
      redFlags.push('Mostly shares others\' content rather than original insights')
    }
    
    return redFlags
  }

  /**
   * Identify key strengths based on the intelligence gathered
   */
  private identifyStrengths(
    webResearch: WebResearchResult,
    linkedInAnalysis: ComprehensiveLinkedInProfile,
    scores: ConnectionIntelligenceProfile['unifiedScores']
  ): string[] {
    const strengths: string[] = []
    
    // High expertise scores
    if (scores.overallExpertise > 80) {
      strengths.push('Strong overall expertise in talent management space')
    }
    
    // External validation
    if (webResearch.articlesFound.length >= 3) {
      strengths.push('Published thought leadership content externally')
    }
    
    // Practical experience
    if (scores.practicalExperience > 80) {
      strengths.push('Demonstrates hands-on practical experience')
    }
    
    // Consistent content
    if (linkedInAnalysis.authorityAssessment.contentConsistency > 80) {
      strengths.push('Consistent focus on relevant topics')
    }
    
    // Industry recognition
    if (scores.industryRecognition > 70) {
      strengths.push('High engagement and industry recognition')
    }
    
    // Speaking/conferences
    const speakingSignals = webResearch.expertiseSignals.filter(s => 
      s.signal.toLowerCase().includes('spoke') || s.signal.toLowerCase().includes('keynote')
    )
    if (speakingSignals.length > 0) {
      strengths.push('Conference speaker and industry presenter')
    }
    
    return strengths
  }

  /**
   * Generate actionable recommendations based on intelligence
   */
  private generateRecommendations(
    webResearch: WebResearchResult,
    linkedInAnalysis: ComprehensiveLinkedInProfile,
    scores: ConnectionIntelligenceProfile['unifiedScores']
  ): string[] {
    const recommendations: string[] = []
    
    // High-value prospect recommendations
    if (scores.overallExpertise > 70) {
      recommendations.push('High-value prospect - prioritize for outreach')
    }
    
    // Specific expertise area recommendations
    if (scores.talentManagement > 80) {
      recommendations.push('Excellent for talent management solutions discussions')
    }
    if (scores.peopleDevelopment > 80) {
      recommendations.push('Strong candidate for people development initiatives')
    }
    if (scores.hrTechnology > 80) {
      recommendations.push('Good fit for HR technology conversations')
    }
    
    // Engagement strategy recommendations
    if (linkedInAnalysis.authorityAssessment.thoughtLeadership > 70) {
      recommendations.push('Engage through thought leadership content and industry insights')
    }
    
    const practicalPosts = linkedInAnalysis.postsAnalysis.filter(p => p.practicalValue > 70)
    if (practicalPosts.length > 3) {
      recommendations.push('Values practical, actionable insights - focus on ROI and implementation')
    }
    
    // Content strategy recommendations
    const topicAreas = this.identifyTopContentTopics(linkedInAnalysis)
    if (topicAreas.length > 0) {
      recommendations.push(`Most engaged with: ${topicAreas.join(', ')} - tailor content accordingly`)
    }
    
    return recommendations
  }

  /**
   * Identify top content topics the connection engages with
   */
  private identifyTopContentTopics(linkedInAnalysis: ComprehensiveLinkedInProfile): string[] {
    const topics: string[] = []
    
    if (linkedInAnalysis.expertiseScores.talentManagement > 60) topics.push('talent management')
    if (linkedInAnalysis.expertiseScores.peopleDevelopment > 60) topics.push('people development')
    if (linkedInAnalysis.expertiseScores.hrTechnology > 60) topics.push('HR technology')
    if (linkedInAnalysis.expertiseScores.leadership > 60) topics.push('leadership')
    
    return topics.sort((a, b) => {
      const scoreA = linkedInAnalysis.expertiseScores[a.replace(' ', '') as keyof typeof linkedInAnalysis.expertiseScores] || 0
      const scoreB = linkedInAnalysis.expertiseScores[b.replace(' ', '') as keyof typeof linkedInAnalysis.expertiseScores] || 0
      return scoreB - scoreA
    }).slice(0, 3)
  }

  /**
   * Determine overall verification status
   */
  private determineVerificationStatus(
    expertiseVerification: ExpertiseVerification[],
    confidenceLevel: number,
    redFlagsCount: number
  ): 'verified' | 'likely' | 'unverified' {
    const verifiedClaims = expertiseVerification.filter(v => v.verified).length
    const totalClaims = expertiseVerification.length
    
    if (confidenceLevel > 80 && verifiedClaims >= totalClaims * 0.7 && redFlagsCount === 0) {
      return 'verified'
    }
    
    if (confidenceLevel > 60 && verifiedClaims >= totalClaims * 0.5 && redFlagsCount <= 1) {
      return 'likely'
    }
    
    return 'unverified'
  }

  /**
   * Get connection by ID
   */
  private async getConnectionById(connectionId: string): Promise<DBLinkedInConnection | null> {
    if (!supabaseLinkedIn) {
      throw new Error('Supabase LinkedIn service not available')
    }
    
    // This would need to be implemented in the supabase service
    // For now, we'll need to get all connections and filter
    const connections = await supabaseLinkedIn.getConnections()
    return connections.find(c => c.id === connectionId) || null
  }

  /**
   * Store intelligence profile in database
   */
  private async storeIntelligenceProfile(profile: ConnectionIntelligenceProfile): Promise<void> {
    // This would store the intelligence profile in a dedicated table
    // For now, we'll log it
    console.log(`💾 Storing intelligence profile for ${profile.connectionName}`, {
      overallExpertise: profile.unifiedScores.overallExpertise,
      verificationStatus: profile.intelligenceAssessment.verificationStatus,
      confidenceLevel: profile.intelligenceAssessment.confidenceLevel
    })
  }

  /**
   * Process multiple connections in batch
   */
  async processBatch(request: BatchResearchRequest): Promise<BatchResearchResult> {
    const requestId = `batch-${Date.now()}`
    console.log(`🔄 Starting batch research: ${requestId}`)
    
    const result: BatchResearchResult = {
      requestId,
      totalConnections: request.connectionIds.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      results: [],
      errors: [],
      summary: {
        highValueProspects: 0,
        averageExpertiseScore: 0,
        topExpertiseAreas: [],
        researchQualityDistribution: { high: 0, medium: 0, low: 0 }
      }
    }
    
    // Process connections with concurrency control
    const concurrency = Math.min(request.maxConcurrency, 3) // Max 3 concurrent
    const batches = this.chunkArray(request.connectionIds, concurrency)
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (connectionId) => {
        result.inProgress++
        
        try {
          const profile = await this.generateIntelligenceProfile(connectionId)
          result.results.push(profile)
          result.completed++
          result.inProgress--
          
          console.log(`✅ Completed ${result.completed}/${result.totalConnections}: ${profile.connectionName}`)
          
        } catch (error) {
          result.errors.push({
            connectionId,
            error: error.message
          })
          result.failed++
          result.inProgress--
          
          console.error(`❌ Failed ${connectionId}:`, error.message)
        }
      })
      
      await Promise.all(batchPromises)
    }
    
    // Calculate summary
    result.summary = this.calculateBatchSummary(result.results)
    
    console.log(`🎯 Batch research completed: ${result.completed} successful, ${result.failed} failed`)
    
    return result
  }

  /**
   * Calculate summary statistics for batch results
   */
  private calculateBatchSummary(results: ConnectionIntelligenceProfile[]): BatchResearchResult['summary'] {
    const highValueProspects = results.filter(r => r.unifiedScores.overallExpertise > 70).length
    
    const averageExpertiseScore = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.unifiedScores.overallExpertise, 0) / results.length)
      : 0
    
    // Count expertise areas
    const expertiseAreas = {
      'talent management': 0,
      'people development': 0,
      'hr technology': 0,
      'leadership': 0
    }
    
    results.forEach(r => {
      if (r.unifiedScores.talentManagement > 60) expertiseAreas['talent management']++
      if (r.unifiedScores.peopleDevelopment > 60) expertiseAreas['people development']++
      if (r.unifiedScores.hrTechnology > 60) expertiseAreas['hr technology']++
      if (r.unifiedScores.leadership > 60) expertiseAreas['leadership']++
    })
    
    const topExpertiseAreas = Object.entries(expertiseAreas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area]) => area)
    
    // Research quality distribution
    const researchQualityDistribution = {
      high: results.filter(r => r.intelligenceAssessment.dataQuality === 'high').length,
      medium: results.filter(r => r.intelligenceAssessment.dataQuality === 'medium').length,
      low: results.filter(r => r.intelligenceAssessment.dataQuality === 'low').length
    }
    
    return {
      highValueProspects,
      averageExpertiseScore,
      topExpertiseAreas,
      researchQualityDistribution
    }
  }

  /**
   * Utility to chunk array for batch processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// Export singleton instance
export const connectionIntelligenceService = new ConnectionIntelligenceService()