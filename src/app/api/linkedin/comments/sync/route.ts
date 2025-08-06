import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting LinkedIn post comments sync...')

    // Check environment variables
    if (!process.env.RAPIDAPI_KEY) {
      return NextResponse.json({ 
        error: 'Missing RapidAPI configuration. Please set RAPIDAPI_KEY environment variable.' 
      }, { status: 500 })
    }

    const body = await request.json()
    const { postUrl, pageNumber = 1, sortOrder = 'Most relevant' } = body

    if (!postUrl) {
      return NextResponse.json({ 
        error: 'Post URL is required' 
      }, { status: 400 })
    }

    console.log(`📡 Fetching comments for post: ${postUrl}`)

    // Encode the post URL for the API call
    const encodedPostUrl = encodeURIComponent(postUrl)
    const rapidApiUrl = `https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/post/comments?post_url=${encodedPostUrl}&page_number=${pageNumber}&sort_order=${encodeURIComponent(sortOrder)}`
    
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
      console.error(`RapidAPI error:`, response.status, errorText)
      
      return NextResponse.json({
        error: `Failed to fetch comments: ${response.status}`,
        details: errorText
      }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ Fetched comments data:`, { 
      hasComments: !!data.comments, 
      commentCount: data.comments?.length || 0 
    })

    // Process and save comments to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)
    const results = []
    let newComments = 0
    let updatedComments = 0
    let errors = 0

    if (data.comments && Array.isArray(data.comments)) {
      for (const comment of data.comments) {
        try {
          // Extract post URN from URL if needed
          const postUrn = extractPostUrnFromUrl(postUrl)
          
          const commentData = {
            comment_id: comment.id || comment.comment_id,
            post_urn: postUrn,
            text: comment.text || comment.comment_text,
            posted_at: comment.posted_at || comment.created_time,
            is_edited: comment.is_edited || false,
            is_pinned: comment.is_pinned || false,
            comment_url: comment.comment_url || `${postUrl}#comment-${comment.id}`,
            
            // Author information
            author_name: comment.author?.name || comment.author_name,
            author_headline: comment.author?.headline || comment.author_headline,
            author_profile_url: comment.author?.profile_url || comment.author_linkedin_url,
            author_profile_picture: comment.author?.profile_picture || comment.author_profile_picture,
            
            // Engagement metrics
            total_reactions: comment.total_reactions || comment.likes_count || 0,
            like_reactions: comment.like_reactions || comment.likes_count || 0,
            appreciation_reactions: comment.appreciation_reactions || 0,
            empathy_reactions: comment.empathy_reactions || 0,
            interest_reactions: comment.interest_reactions || 0,
            praise_reactions: comment.praise_reactions || 0,
            comments_count: comment.replies_count || comment.comments_count || 0,
            replies: comment.replies ? JSON.stringify(comment.replies) : null,
            replies_count: comment.replies_count || 0,
            
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Check if comment already exists
          const { data: existingComment } = await supabase
            .from('linkedin_comments')
            .select('id')
            .eq('comment_id', commentData.comment_id)
            .single()

          let result
          if (existingComment) {
            // Update existing comment
            const { data: updated, error } = await supabase
              .from('linkedin_comments')
              .update({
                ...commentData,
                updated_at: new Date().toISOString()
              })
              .eq('comment_id', commentData.comment_id)
              .select()
              .single()

            if (error) throw error
            result = updated
            updatedComments++
            console.log(`✅ Updated comment: ${commentData.comment_id}`)
          } else {
            // Insert new comment
            const { data: inserted, error } = await supabase
              .from('linkedin_comments')
              .insert(commentData)
              .select()
              .single()

            if (error) throw error
            result = inserted
            newComments++
            console.log(`✅ Saved new comment: ${commentData.comment_id} by ${commentData.author_name}`)
          }

          results.push({
            comment_id: commentData.comment_id,
            status: existingComment ? 'updated' : 'new',
            author: commentData.author_name,
            text_preview: (commentData.text || '').substring(0, 100)
          })

        } catch (error: any) {
          console.error(`❌ Error processing comment:`, error.message)
          errors++
          
          results.push({
            comment_id: comment.id || 'unknown',
            status: 'error',
            error: error.message
          })
        }
      }
    }

    const summary = {
      postUrl,
      totalFetched: data.comments?.length || 0,
      newComments,
      updatedComments,
      errors,
      pageNumber,
      sortOrder
    }

    console.log('📈 LinkedIn Comments Sync Summary:', summary)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${data.comments?.length || 0} comments for post`,
      data: {
        comments: results,
        summary,
        rawData: data // Include raw data for debugging
      }
    })

  } catch (error: any) {
    console.error('❌ LinkedIn comments sync failed:', error)
    
    return NextResponse.json({ 
      success: false,
      error: 'LinkedIn comments sync failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Helper function to extract post URN from LinkedIn URL
function extractPostUrnFromUrl(postUrl: string): string {
  try {
    // Extract activity ID from URL like:
    // https://www.linkedin.com/posts/satyanadella_mayo-clinic-accelerates-personalized-medicine-activity-7285003244957773826-TrmI/
    const match = postUrl.match(/activity-(\d+)-/)
    if (match) {
      return `urn:li:activity:${match[1]}`
    }
    
    // Fallback: use the full URL as URN
    return postUrl
  } catch (error) {
    console.warn('Failed to extract URN from URL, using full URL:', postUrl)
    return postUrl
  }
}

// GET endpoint for checking comments sync status
export async function GET(request: NextRequest) {
  try {
    const postUrl = request.nextUrl.searchParams.get('postUrl')
    
    if (!postUrl) {
      return NextResponse.json({ 
        error: 'Post URL parameter is required' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const postUrn = extractPostUrnFromUrl(postUrl)
    
    // Get comments for this post from database
    const { data: comments, error } = await supabase
      .from('linkedin_comments')
      .select('*')
      .eq('post_urn', postUrn)
      .order('posted_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    const stats = {
      totalComments: comments?.length || 0,
      latestComment: comments?.[0]?.posted_at,
      lastSync: comments?.[0]?.created_at,
      avgReactions: comments && comments.length > 0 
        ? Math.round(comments.reduce((sum, comment) => sum + (comment.total_reactions || 0), 0) / comments.length)
        : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        postUrl,
        postUrn,
        stats,
        recentComments: comments?.slice(0, 5).map(comment => ({
          comment_id: comment.comment_id,
          author: comment.author_name,
          text: (comment.text || '').substring(0, 100) + '...',
          posted_at: comment.posted_at,
          total_reactions: comment.total_reactions,
          replies_count: comment.replies_count
        })) || []
      }
    })
    
  } catch (error: any) {
    console.error('Error getting LinkedIn comments status:', error)
    
    return NextResponse.json({ 
      error: 'Failed to get comments status',
      details: error.message 
    }, { status: 500 })
  }
}