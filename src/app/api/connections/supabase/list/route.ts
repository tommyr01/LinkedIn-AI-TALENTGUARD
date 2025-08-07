import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log('📡 Fetching connections from Supabase...')
    console.log('🔑 Using Supabase URL:', supabaseUrl)
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: connections, error } = await supabase
      .from('linkedin_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch connections from database',
        details: error.message
      }, { status: 500 })
    }
    
    console.log(`✅ Successfully fetched ${connections?.length || 0} connections from Supabase`)
    
    // Log raw connections for debugging
    if (connections && connections.length > 0) {
      console.log('📊 Raw connections data:', connections.map((c: any) => ({
        id: c.id,
        full_name: c.full_name,
        username: c.username,
        created_at: c.created_at
      })))
    }

    // Transform data to match the expected format - ensure we have an array
    const transformedConnections = (connections || []).map((conn: any) => ({
      id: conn.id,
      name: conn.full_name || 'Unknown',
      role: conn.title || conn.headline || 'N/A',
      company: conn.current_company || 'N/A',
      linkedinUrl: conn.username ? `https://linkedin.com/in/${conn.username}` : '#',
      profilePictureUrl: conn.profile_picture_url,
      lastEngagement: calculateLastEngagement(conn.last_synced_at),
      engagementScore: calculateEngagementScore(conn),
      tags: generateTags(conn),
      notes: conn.about ? conn.about.substring(0, 200) : '',
      startDate: conn.start_date || conn.created_at, // Use employment start_date if available
      followerCount: conn.follower_count || 0,
      connectionCount: conn.connection_count || 0,
      companyLinkedinUrl: conn.company_linkedin_url || '', // Use actual company URL
      location: conn.full_location || 'N/A'
    }))
    
    console.log(`🔄 Transformed ${transformedConnections.length} connections for display`)
    console.log('📤 Returning connections:', transformedConnections.map(c => c.name))

    return NextResponse.json(transformedConnections)

  } catch (error: any) {
    console.error('Error fetching connections:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

function calculateLastEngagement(lastSyncedAt: string): string {
  if (!lastSyncedAt) return 'Never'
  
  const lastSync = new Date(lastSyncedAt)
  const now = new Date()
  const diffInHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
  return `${Math.floor(diffInHours / 168)} weeks ago`
}

function calculateEngagementScore(connection: any): number {
  // Basic scoring algorithm based on profile completeness and activity
  let score = 50 // Base score
  
  if (connection.follower_count > 1000) score += 20
  if (connection.follower_count > 10000) score += 10
  if (connection.is_creator) score += 15
  if (connection.is_influencer) score += 10
  if (connection.about && connection.about.length > 100) score += 10
  if (connection.profile_picture_url) score += 5
  
  return Math.min(100, score)
}

function generateTags(connection: any): string[] {
  const tags: string[] = []
  
  if (connection.is_creator) tags.push('Creator')
  if (connection.is_influencer) tags.push('Influencer')
  if (connection.is_premium) tags.push('Premium')
  if (connection.follower_count > 10000) tags.push('High Influence')
  if (connection.current_company) tags.push('Employed')
  
  return tags
}