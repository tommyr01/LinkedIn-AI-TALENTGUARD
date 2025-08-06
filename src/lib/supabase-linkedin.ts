import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// LinkedIn API Response Types
export interface LinkedInPost {
  urn: string
  full_urn: string
  posted_at: string | {
    date: string
    relative: string
    timestamp: number
  }
  text: string
  url: string
  post_type: string
  author: {
    first_name: string
    last_name: string
    headline: string
    username: string
    profile_url: string
    profile_picture: string
  }
  stats: {
    total_reactions: number
    like: number
    support: number
    love: number
    insight: number
    celebrate: number
    comments: number
    reposts: number
  }
  document?: {
    title: string
    page_count: number
    url: string
    thumbnail: string
  }
}

export interface LinkedInComment {
  comment_id: string
  text: string
  posted_at: string
  is_edited: boolean
  is_pinned: boolean
  comment_url: string
  author: {
    name: string
    headline: string
    profile_url: string
    profile_picture: string
  }
  stats: {
    total_reactions: number
    reactions: {
      like: number
      appreciation: number
      empathy: number
      interest: number
      praise: number
    }
    comments: number
  }
  replies?: any[]
}

// Database row types
export interface DBLinkedInPost {
  id: string
  urn: string
  full_urn?: string
  posted_at: string
  text: string
  url: string
  post_type: string
  author_first_name: string
  author_last_name: string
  author_headline: string
  author_username: string
  author_profile_url: string
  author_profile_picture: string
  total_reactions: number
  like_count: number
  support_count: number
  love_count: number
  insight_count: number
  celebrate_count: number
  comments_count: number
  reposts_count: number
  document_title?: string
  document_page_count?: number
  document_url?: string
  document_thumbnail?: string
  created_at: string
  updated_at: string
  last_synced_at: string
}

export interface DBLinkedInComment {
  id: string
  comment_id: string
  post_urn: string
  text: string
  posted_at: string
  is_edited: boolean
  is_pinned: boolean
  comment_url: string
  author_name: string
  author_headline: string
  author_profile_url: string
  author_profile_picture: string
  total_reactions: number
  like_reactions: number
  appreciation_reactions: number
  empathy_reactions: number
  interest_reactions: number
  praise_reactions: number
  comments_count: number
  replies?: any
  replies_count: number
  icp_score?: number
  icp_category?: string
  icp_breakdown?: any
  icp_tags?: string[]
  icp_reasoning?: string[]
  icp_confidence?: number
  profile_researched: boolean
  research_completed_at?: string
  created_at: string
  updated_at: string
}

export interface DBLinkedInProfile {
  id: string
  profile_url: string
  name: string
  headline: string
  profile_picture: string
  about?: string
  location?: string
  current_company?: string
  current_role?: string
  follower_count: number
  connection_count: number
  icp_score?: number
  icp_category?: string
  icp_breakdown?: any
  icp_tags?: string[]
  icp_reasoning?: string[]
  icp_confidence?: number
  data_quality?: string
  signals?: string[]
  red_flags?: string[]
  last_researched_at?: string
  research_source?: string
  created_at: string
  updated_at: string
}

// ICP Scoring Types
export interface ICPScore {
  totalScore: number
  category: 'High Value' | 'Medium Value' | 'Low Value' | 'Not Qualified'
  breakdown: {
    roleScore: number
    companyScore: number
    engagementScore: number
    industryScore: number
  }
  tags: string[]
  reasoning: string[]
  confidence: number
  dataQuality: 'high' | 'medium' | 'low'
  signals: string[]
  redFlags: string[]
}

export interface ProspectProfile {
  name: string
  headline: string
  company: string
  role: string
  profileUrl: string
  profilePicture: string
  location: string
  followerCount: number
  connectionCount: number
  icpScore: ICPScore
}

export class TalentGuardLinkedInService {
  
  // Posts Operations
  async upsertPost(linkedInPost: any): Promise<DBLinkedInPost> {
    const dbPost = this.transformPostToDB(linkedInPost)
    
    const { data, error } = await supabase
      .from('linkedin_posts')
      .upsert(dbPost, { 
        onConflict: 'urn',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting LinkedIn post:', error)
      throw new Error(`Failed to save post: ${error.message}`)
    }

    // Record engagement history if stats exist
    const urn = linkedInPost.activity_urn || linkedInPost.urn
    if (urn && linkedInPost.stats) {
      await this.recordEngagementHistory(urn, linkedInPost.stats)
    }

    return data
  }

  async getPostsByUsername(username: string, limit: number = 50): Promise<DBLinkedInPost[]> {
    const { data, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .eq('author_username', username)
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching posts:', error)
      throw new Error(`Failed to fetch posts: ${error.message}`)
    }

    return data || []
  }

  async getAllPosts(limit: number = 50): Promise<DBLinkedInPost[]> {
    const { data, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching all posts:', error)
      throw new Error(`Failed to fetch posts: ${error.message}`)
    }

    return data || []
  }

  async getPostByUrn(urn: string): Promise<DBLinkedInPost | null> {
    const { data, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .eq('urn', urn)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching post:', error)
      throw new Error(`Failed to fetch post: ${error.message}`)
    }

    return data
  }

  // Comments Operations
  async upsertComment(comment: LinkedInComment, postUrn: string): Promise<DBLinkedInComment> {
    const dbComment = this.transformCommentToDB(comment, postUrn)
    
    const { data, error } = await supabase
      .from('linkedin_comments')
      .upsert(dbComment, { 
        onConflict: 'comment_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting LinkedIn comment:', error)
      throw new Error(`Failed to save comment: ${error.message}`)
    }

    return data
  }

  async getCommentsByPostUrn(postUrn: string): Promise<DBLinkedInComment[]> {
    const { data, error } = await supabase
      .from('linkedin_comments')
      .select('*')
      .eq('post_urn', postUrn)
      .order('posted_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    return data || []
  }

  // Profile Research & ICP Scoring
  async researchCommentAuthor(comment: LinkedInComment): Promise<ProspectProfile | null> {
    try {
      // Check if profile already exists
      const existingProfile = await this.getProfileByUrl(comment.author.profile_url)
      
      if (existingProfile && existingProfile.last_researched_at) {
        // If researched within last 7 days, return existing data
        const lastResearch = new Date(existingProfile.last_researched_at)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        
        if (lastResearch > sevenDaysAgo) {
          return this.transformDBProfileToProspect(existingProfile)
        }
      }

      // Create ICP score for the prospect
      const icpScore = this.calculateICPScore(comment.author)
      
      const prospectProfile: ProspectProfile = {
        name: comment.author.name,
        headline: comment.author.headline,
        company: this.extractCompanyFromHeadline(comment.author.headline),
        role: this.extractRoleFromHeadline(comment.author.headline),
        profileUrl: comment.author.profile_url,
        profilePicture: comment.author.profile_picture,
        location: '', // Not available in comment data
        followerCount: 0, // Not available in comment data
        connectionCount: 0, // Not available in comment data
        icpScore
      }
      
      // Save to database
      await this.upsertProfile({
        profile_url: comment.author.profile_url,
        name: comment.author.name,
        headline: comment.author.headline,
        profile_picture: comment.author.profile_picture,
        current_company: prospectProfile.company,
        current_role: prospectProfile.role,
        icp_score: icpScore.totalScore,
        icp_category: icpScore.category,
        icp_breakdown: icpScore.breakdown,
        icp_tags: icpScore.tags,
        icp_reasoning: icpScore.reasoning,
        icp_confidence: icpScore.confidence,
        data_quality: icpScore.dataQuality,
        signals: icpScore.signals,
        red_flags: icpScore.redFlags
      })

      console.log(`✅ ICP scoring for ${comment.author.name}: ${icpScore.totalScore}/100 (${icpScore.category})`)

      return prospectProfile
    } catch (error) {
      console.error('Error researching comment author:', error)
      return null
    }
  }

  async upsertProfile(profileData: any): Promise<void> {
    const { error } = await supabase
      .from('linkedin_profiles')
      .upsert({
        ...profileData,
        last_researched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'profile_url',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error upserting profile:', error)
      throw new Error(`Failed to save profile: ${error.message}`)
    }
  }

  async getProfileByUrl(profileUrl: string): Promise<DBLinkedInProfile | null> {
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('profile_url', profileUrl)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    return data
  }

  // Engagement History
  async recordEngagementHistory(postUrn: string, stats: any): Promise<void> {
    const { error } = await supabase
      .from('post_engagement_history')
      .insert({
        post_urn: postUrn,
        total_reactions: stats.total_reactions,
        like_count: stats.like,
        support_count: stats.support,
        love_count: stats.love,
        insight_count: stats.insight,
        celebrate_count: stats.celebrate,
        comments_count: stats.comments,
        reposts_count: stats.reposts,
        recorded_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error recording engagement history:', error)
      // Don't throw - this is non-critical
    }
  }

  // Analytics
  async getHighValueProspects(minScore: number = 60): Promise<DBLinkedInProfile[]> {
    const { data, error } = await supabase
      .from('high_value_linkedin_prospects')
      .select('*')
      .gte('icp_score', minScore)
      .order('icp_score', { ascending: false })

    if (error) {
      console.error('Error fetching high value prospects:', error)
      return []
    }

    return data || []
  }

  async getPostsWithStats(): Promise<any[]> {
    const { data, error } = await supabase
      .from('posts_with_latest_stats')
      .select('*')
      .order('posted_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts with stats:', error)
      throw new Error(`Failed to fetch posts: ${error.message}`)
    }

    return data || []
  }

  // Transform functions
  private transformPostToDB(post: any): Partial<DBLinkedInPost> {
    // Handle different timestamp formats from LinkedIn API
    let postedAt: string | undefined = undefined
    if (post.posted_at) {
      if (typeof post.posted_at === 'string') {
        postedAt = post.posted_at
      } else if (typeof post.posted_at === 'object' && post.posted_at.date) {
        postedAt = new Date(post.posted_at.date).toISOString()
      } else if (typeof post.posted_at === 'object' && post.posted_at.timestamp) {
        // Fix: timestamp is already in milliseconds, not seconds
        postedAt = new Date(post.posted_at.timestamp).toISOString()
      }
    }

    // Use activity_urn as the main URN for TalentGuard company posts
    const urn = post.activity_urn || post.urn
    const fullUrn = post.full_urn || post.activity_urn || post.urn
    const postUrl = post.post_url || post.url

    return {
      urn: urn,
      full_urn: fullUrn,
      posted_at: postedAt,
      text: post.text || '',
      url: postUrl,
      post_type: post.post_type || 'regular',
      // Company posts have different author structure
      author_first_name: post.author?.name?.split(' ')[0] || 'TalentGuard',
      author_last_name: post.author?.name?.split(' ').slice(1).join(' ') || '',
      author_headline: '', // Company posts don't have author headlines
      author_username: 'talentguard', // Fixed username for company posts
      author_profile_url: post.author?.company_url || 'https://www.linkedin.com/company/talentguard',
      author_profile_picture: post.author?.logo_url || '',
      total_reactions: post.stats?.total_reactions || 0,
      like_count: post.stats?.like || 0,
      support_count: post.stats?.support || 0,
      love_count: post.stats?.love || 0,
      insight_count: post.stats?.insight || 0,
      celebrate_count: post.stats?.celebrate || 0,
      comments_count: post.stats?.comments || 0,
      reposts_count: post.stats?.reposts || 0,
      document_title: post.document?.title || null,
      document_page_count: post.document?.page_count || null,
      document_url: post.document?.url || null,
      document_thumbnail: post.document?.thumbnail || null,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  private transformCommentToDB(comment: LinkedInComment, postUrn: string): Partial<DBLinkedInComment> {
    return {
      comment_id: comment.comment_id,
      post_urn: postUrn,
      text: comment.text,
      posted_at: comment.posted_at,
      is_edited: comment.is_edited,
      is_pinned: comment.is_pinned,
      comment_url: comment.comment_url,
      author_name: comment.author.name,
      author_headline: comment.author.headline,
      author_profile_url: comment.author.profile_url,
      author_profile_picture: comment.author.profile_picture,
      total_reactions: comment.stats.total_reactions,
      like_reactions: comment.stats.reactions.like,
      appreciation_reactions: comment.stats.reactions.appreciation,
      empathy_reactions: comment.stats.reactions.empathy,
      interest_reactions: comment.stats.reactions.interest,
      praise_reactions: comment.stats.reactions.praise,
      comments_count: comment.stats.comments,
      replies: comment.replies,
      replies_count: comment.replies?.length || 0,
      profile_researched: false,
      updated_at: new Date().toISOString()
    }
  }

  private transformDBProfileToProspect(dbProfile: DBLinkedInProfile): ProspectProfile {
    return {
      name: dbProfile.name,
      headline: dbProfile.headline,
      company: dbProfile.current_company || '',
      role: dbProfile.current_role || '',
      profileUrl: dbProfile.profile_url,
      profilePicture: dbProfile.profile_picture,
      location: dbProfile.location || '',
      followerCount: dbProfile.follower_count || 0,
      connectionCount: dbProfile.connection_count || 0,
      icpScore: {
        totalScore: dbProfile.icp_score || 0,
        category: dbProfile.icp_category as any || 'Not Qualified',
        breakdown: dbProfile.icp_breakdown || { roleScore: 0, companyScore: 0, engagementScore: 0, industryScore: 0 },
        tags: dbProfile.icp_tags || [],
        reasoning: dbProfile.icp_reasoning || [],
        confidence: dbProfile.icp_confidence || 75,
        dataQuality: dbProfile.data_quality as any || 'medium',
        signals: dbProfile.signals || [],
        redFlags: dbProfile.red_flags || []
      }
    }
  }

  // ICP Scoring Logic (simplified version for TalentGuard)
  private calculateICPScore(author: { name: string; headline: string; profile_url: string }): ICPScore {
    const headline = author.headline?.toLowerCase() || ''
    
    // Role scoring based on TalentGuard's buyer personas
    let roleScore = 0
    const roleKeywords = {
      'ceo': 25, 'chief executive': 25, 'president': 20, 'founder': 20, 'co-founder': 20,
      'cto': 20, 'chief technology': 20, 'vp': 15, 'vice president': 15,
      'director': 15, 'head of': 12, 'manager': 10, 'lead': 8
    }
    
    for (const [keyword, score] of Object.entries(roleKeywords)) {
      if (headline.includes(keyword)) {
        roleScore = Math.max(roleScore, score)
      }
    }

    // Company/Industry scoring
    let companyScore = 0
    const industryKeywords = {
      'saas': 15, 'software': 15, 'technology': 12, 'tech': 12,
      'startup': 10, 'enterprise': 8, 'consulting': 8, 'fintech': 12,
      'healthcare': 8, 'education': 8, 'manufacturing': 6
    }
    
    for (const [keyword, score] of Object.entries(industryKeywords)) {
      if (headline.includes(keyword)) {
        companyScore = Math.max(companyScore, score)
      }
    }

    // Engagement scoring (basic - could be enhanced with more data)
    const engagementScore = 10 // Base score for commenting on content

    // Industry-specific scoring
    let industryScore = 0
    const targetIndustries = ['hr', 'human resources', 'talent', 'people', 'recruiting']
    for (const industry of targetIndustries) {
      if (headline.includes(industry)) {
        industryScore = 20
        break
      }
    }

    const totalScore = Math.min(100, roleScore + companyScore + engagementScore + industryScore)
    
    // Determine category
    let category: ICPScore['category']
    if (totalScore >= 70) category = 'High Value'
    else if (totalScore >= 50) category = 'Medium Value'
    else if (totalScore >= 30) category = 'Low Value'
    else category = 'Not Qualified'

    // Generate tags and reasoning
    const tags: string[] = []
    const reasoning: string[] = []
    const signals: string[] = []
    
    if (roleScore >= 15) {
      tags.push('decision-maker')
      reasoning.push(`Senior role identified (${roleScore} points)`)
      signals.push('executive-level-position')
    }
    
    if (industryScore > 0) {
      tags.push('target-industry')
      reasoning.push(`Relevant industry match (${industryScore} points)`)
      signals.push('industry-alignment')
    }

    if (companyScore > 0) {
      tags.push('tech-company')
      reasoning.push(`Technology sector (${companyScore} points)`)
    }

    // Basic confidence scoring
    const confidence = Math.min(100, Math.max(60, totalScore + 10))

    return {
      totalScore,
      category,
      breakdown: {
        roleScore,
        companyScore,
        engagementScore,
        industryScore
      },
      tags,
      reasoning,
      confidence,
      dataQuality: headline.length > 50 ? 'high' : headline.length > 20 ? 'medium' : 'low',
      signals,
      redFlags: []
    }
  }

  private extractCompanyFromHeadline(headline: string): string {
    if (!headline) return ''
    
    // Simple extraction - look for "at Company" or "@ Company"
    const atMatch = headline.match(/(?:at|@)\s+([^|•\n]+)/i)
    if (atMatch) {
      return atMatch[1].trim()
    }
    
    // Look for common patterns
    const patterns = [
      /CEO of (.+?)(?:\s*[|•]|$)/i,
      /Founder of (.+?)(?:\s*[|•]|$)/i,
      /(\w+(?:\s+\w+)*)\s*(?:CEO|Founder|CTO|VP)/i
    ]
    
    for (const pattern of patterns) {
      const match = headline.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return ''
  }

  private extractRoleFromHeadline(headline: string): string {
    if (!headline) return ''
    
    const rolePatterns = [
      /^([^|•@]+?)(?:\s+at\s+|\s+@\s+)/i,
      /(CEO|CTO|CFO|VP|President|Founder|Co-Founder|Director|Manager)/i
    ]
    
    for (const pattern of rolePatterns) {
      const match = headline.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return ''
  }
}

// Create service instance
export const talentGuardLinkedIn = new TalentGuardLinkedInService()