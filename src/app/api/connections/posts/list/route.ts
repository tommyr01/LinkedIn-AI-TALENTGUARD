import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Fetch connection posts with connection details
    const { data: posts, error } = await supabase
      .from('connection_posts')
      .select(`
        *,
        linkedin_connections:connection_id (
          full_name,
          current_company,
          profile_picture_url,
          username
        )
      `)
      .order('posted_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch connection posts from database',
        details: error.message
      }, { status: 500 })
    }

    // Transform to match expected format
    const transformedPosts = posts.map((post: any) => ({
      id: post.id,
      connectionName: post.linkedin_connections?.full_name || `${post.author_first_name} ${post.author_last_name}`,
      connectionCompany: post.linkedin_connections?.current_company,
      content: post.post_text || '',
      postedAt: post.posted_date,
      postUrn: post.post_urn,
      postUrl: post.post_url,
      likesCount: post.likes || 0,
      commentsCount: post.comments_count || 0,
      totalReactions: post.total_reactions || 0,
      reposts: post.reposts || 0,
      authorFirstName: post.author_first_name,
      authorLastName: post.author_last_name,
      authorHeadline: post.author_headline,
      authorLinkedInUrl: post.author_linkedin_url,
      authorProfilePicture: post.author_profile_picture || post.linkedin_connections?.profile_picture_url,
      postType: post.post_type || 'regular',
      mediaType: post.media_type,
      mediaUrl: post.media_url,
      mediaThumbnail: post.media_thumbnail,
      createdTime: post.created_at,
      hasMedia: !!(post.media_url || post.media_type),
      support: post.support || 0,
      love: post.love || 0,
      insight: post.insight || 0,
      celebrate: post.celebrate || 0
    }))

    // Calculate stats
    const stats = calculatePostStats(transformedPosts)

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      stats,
      meta: {
        total: transformedPosts.length,
        offset,
        limit
      }
    })

  } catch (error: any) {
    console.error('Error fetching connection posts:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

function calculatePostStats(posts: any[]) {
  const totalPosts = posts.length
  const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0)
  const totalComments = posts.reduce((sum, post) => sum + post.commentsCount, 0)
  const totalReactions = posts.reduce((sum, post) => sum + post.totalReactions, 0)
  const totalReposts = posts.reduce((sum, post) => sum + post.reposts, 0)
  const totalSupport = posts.reduce((sum, post) => sum + post.support, 0)
  const totalLove = posts.reduce((sum, post) => sum + post.love, 0)
  const totalInsight = posts.reduce((sum, post) => sum + post.insight, 0)
  const totalCelebrate = posts.reduce((sum, post) => sum + post.celebrate, 0)
  
  const uniqueConnections = new Set(posts.map(post => post.connectionName)).size
  const averageEngagement = totalPosts > 0 ? Math.round(totalReactions / totalPosts) : 0
  const postsWithMedia = posts.filter(post => post.hasMedia).length

  return {
    totalPosts,
    totalLikes,
    totalComments,
    totalReactions,
    uniqueConnections,
    averageEngagement,
    totalReposts,
    totalSupport,
    totalLove,
    totalInsight,
    totalCelebrate,
    postsWithMedia,
    documentsShared: 0 // Would need document tracking
  }
}