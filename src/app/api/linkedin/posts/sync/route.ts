import { NextRequest, NextResponse } from 'next/server'
import { talentGuardLinkedIn, type LinkedInPost } from '@/lib/supabase-linkedin'
import { isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RapidAPIResponse {
  success?: boolean
  message?: string
  data?: {
    posts?: LinkedInPost[]
    pagination_token?: string
  }
  posts?: LinkedInPost[] // Allow posts at root level
  [key: string]: any // Allow any additional properties for flexibility
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting LinkedIn posts sync for TalentGuard...')

    // Validate Supabase configuration at runtime
    if (!isSupabaseConfigured()) {
      const { error } = validateSupabaseConfig()
      console.error('Supabase configuration error:', error)
      return NextResponse.json({
        error: 'Supabase not configured properly',
        details: error
      }, { status: 500 })
    }

    // Check environment variables
    if (!process.env.RAPIDAPI_KEY) {
      return NextResponse.json({ 
        error: 'Missing RapidAPI configuration. Please set RAPIDAPI_KEY environment variable.' 
      }, { status: 500 })
    }

    // Get request parameters
    const body = await request.json().catch(() => ({}))
    const companyName = body.companyName || 'talentguard'
    const pageNumber = body.pageNumber || 1
    const maxPages = body.maxPages || 2 // Conservative limit for TalentGuard

    let allPosts: LinkedInPost[] = []
    let currentPage = pageNumber
    let hasMorePages = true
    let processedPages = 0

    console.log(`📡 Fetching LinkedIn posts for company: ${companyName}`)

    while (hasMorePages && processedPages < maxPages) {
      console.log(`📡 Fetching posts page ${currentPage} for company ${companyName}...`)
      
      // Updated to use company posts endpoint
      const rapidApiUrl = `https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/company/posts?company_name=${companyName}`
      console.log(`🔗 Request URL: ${rapidApiUrl}`)
      
      const response = await fetch(rapidApiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`RapidAPI error on page ${currentPage}:`, response.status, errorText)
        
        if (response.status === 429) {
          console.log(`⏸️ Rate limited on page ${currentPage}, stopping pagination but keeping existing posts`)
          hasMorePages = false
          break
        }
        
        if (response.status === 502 || response.status === 503) {
          console.log(`⚠️ API temporarily unavailable on page ${currentPage} (${response.status}), stopping pagination but keeping existing posts`)
          hasMorePages = false
          break
        }
        
        // For other errors, stop pagination but don't fail the entire sync
        console.log(`❌ Failed to fetch page ${currentPage}, stopping pagination but keeping existing posts`)
        hasMorePages = false
        break
      }

      let data: RapidAPIResponse
      try {
        data = await response.json()
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON response on page ${currentPage}:`, parseError)
        hasMorePages = false
        break
      }
      
      // Handle different response structures
      const posts = data.data?.posts || data.posts || (Array.isArray(data) ? data : [])
      
      // Check for API errors
      if (data.success === false) {
        console.log(`⚠️ API returned success=false on page ${currentPage}: ${data.message || 'Unknown error'}`)
        hasMorePages = false
        break
      }
      console.log(`✅ Fetched ${posts.length} posts from page ${currentPage}`)
      
      // Validate that posts is actually an array
      if (!Array.isArray(posts)) {
        console.warn(`⚠️ Posts data is not an array on page ${currentPage}:`, typeof posts)
        hasMorePages = false
        break
      }

      if (posts.length === 0) {
        console.log(`ℹ️ No posts found on page ${currentPage}, stopping pagination`)
        hasMorePages = false
        break
      }

      allPosts.push(...posts)
      currentPage++
      processedPages++

      // Simple pagination logic - if we got fewer posts than expected, likely last page
      if (posts.length < 10 || (!data.data?.pagination_token && processedPages >= 1)) {
        console.log(`📄 Reached end of available posts (got ${posts.length} posts)`)
        hasMorePages = false
      }

      // Add delay between requests to be respectful
      if (hasMorePages && processedPages < maxPages) {
        console.log(`⏳ Waiting 3 seconds before fetching page ${currentPage + 1}...`)
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    console.log(`📊 Total posts fetched: ${allPosts.length} from ${processedPages} pages`)
    
    // If we have no posts at all, that's a real error
    if (allPosts.length === 0) {
      throw new Error('No posts were fetched from any page. Please check API credentials and try again.')
    }

    // Process and save posts to Supabase
    const results = []
    let newPosts = 0
    let updatedPosts = 0
    let errors = 0

    for (const post of allPosts) {
      try {
        // Check if post already exists
        const existingPost = await talentGuardLinkedIn.getPostByUrn(post.urn)
        const isNewPost = !existingPost

        // Save/update post
        const savedPost = await talentGuardLinkedIn.upsertPost(post)
        
        results.push({
          urn: post.urn,
          status: isNewPost ? 'new' : 'updated',
          posted_at: post.posted_at,
          engagement: post.stats.total_reactions,
          author: `${post.author.first_name} ${post.author.last_name}`.trim()
        })

        if (isNewPost) {
          newPosts++
          console.log(`✅ Saved new post: ${post.urn} by ${post.author.first_name} ${post.author.last_name}`)
        } else {
          updatedPosts++
          console.log(`✅ Updated existing post: ${post.urn}`)
        }
        
      } catch (error: any) {
        console.error(`❌ Error processing post ${post.urn}:`, error.message)
        errors++
        
        results.push({
          urn: post.urn,
          status: 'error',
          error: error.message
        })
      }
    }

    const summary = {
      totalFetched: allPosts.length,
      newPosts,
      updatedPosts,
      errors,
      pagesProcessed: processedPages,
      companyName
    }

    console.log('📈 TalentGuard LinkedIn Sync Summary:', summary)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${allPosts.length} LinkedIn posts for ${companyName}`,
      data: {
        posts: results,
        summary,
        nextActions: [
          'Sync comments for new posts to identify prospects',
          'Research comment authors for ICP scoring',
          'Update engagement metrics',
          'Generate buyer signals from LinkedIn engagement'
        ]
      }
    })

  } catch (error: any) {
    console.error('❌ TalentGuard LinkedIn posts sync failed:', error)
    
    return NextResponse.json({ 
      success: false,
      error: 'LinkedIn posts sync failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint for checking sync status
export async function GET(request: NextRequest) {
  try {
    // Validate Supabase configuration at runtime
    if (!isSupabaseConfigured()) {
      const { error } = validateSupabaseConfig()
      return NextResponse.json({
        error: 'Supabase not configured properly',
        details: error
      }, { status: 500 })
    }

    const companyName = request.nextUrl.searchParams.get('companyName') || 'talentguard'
    
    // Get latest posts from database - this would need to be updated to filter by company
    const posts = await talentGuardLinkedIn.getPostsByUsername(companyName, 10)
    
    const stats = {
      totalPosts: posts.length,
      latestPost: posts[0]?.posted_at,
      lastSync: posts[0]?.last_synced_at,
      avgEngagement: posts.length > 0 
        ? Math.round(posts.reduce((sum, post) => sum + (post.total_reactions || 0), 0) / posts.length)
        : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        companyName,
        stats,
        recentPosts: posts.slice(0, 5).map(post => ({
          urn: post.urn,
          text: (post.text || '').substring(0, 100) + '...',
          posted_at: post.posted_at,
          total_reactions: post.total_reactions,
          comments_count: post.comments_count,
          author: `${post.author_first_name} ${post.author_last_name}`.trim()
        }))
      }
    })
    
  } catch (error: any) {
    console.error('Error getting LinkedIn sync status:', error)
    
    return NextResponse.json({ 
      error: 'Failed to get sync status',
      details: error.message 
    }, { status: 500 })
  }
}