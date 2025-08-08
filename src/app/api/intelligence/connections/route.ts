import { NextRequest, NextResponse } from 'next/server'
import { supabaseLinkedIn } from '@/lib/supabase-linkedin'
import { isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase'
import { withUserAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/intelligence/connections
 * Get available LinkedIn connections for intelligence research
 */
async function getHandler(request: AuthenticatedRequest) {
  try {
    // Validate Supabase configuration
    if (!isSupabaseConfigured()) {
      const { error } = validateSupabaseConfig()
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured properly',
        details: error
      }, { status: 500 })
    }

    if (!supabaseLinkedIn) {
      return NextResponse.json({
        success: false,
        error: 'Supabase LinkedIn service not available'
      }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')

    console.log(`📡 Fetching LinkedIn connections for intelligence research (limit: ${limit})`)

    // Get connections from database
    let connections = await supabaseLinkedIn.getConnections(limit)

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      connections = connections.filter(connection => 
        connection.full_name.toLowerCase().includes(searchLower) ||
        (connection.current_company?.toLowerCase() || '').includes(searchLower) ||
        (connection.title?.toLowerCase() || '').includes(searchLower) ||
        (connection.headline?.toLowerCase() || '').includes(searchLower)
      )
    }

    // Transform to simplified format for the intelligence dashboard
    const formattedConnections = connections.map(connection => ({
      id: connection.id,
      full_name: connection.full_name,
      first_name: connection.first_name,
      last_name: connection.last_name,
      current_company: connection.current_company,
      title: connection.title,
      headline: connection.headline,
      username: connection.username,
      profile_picture_url: connection.profile_picture_url,
      follower_count: connection.follower_count,
      connection_count: connection.connection_count,
      last_synced_at: connection.last_synced_at
    }))

    console.log(`✅ Retrieved ${formattedConnections.length} connections for intelligence research`)

    return NextResponse.json({
      success: true,
      message: `Retrieved ${formattedConnections.length} LinkedIn connections`,
      data: {
        connections: formattedConnections,
        total: formattedConnections.length,
        meta: {
          limit,
          search: search || null,
          hasMore: connections.length === limit
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching connections for intelligence:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch connections',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * POST /api/intelligence/connections/sync
 * Sync LinkedIn connections from external source for intelligence research
 */
async function postHandler(request: AuthenticatedRequest) {
  try {
    // Validate Supabase configuration
    if (!isSupabaseConfigured()) {
      const { error } = validateSupabaseConfig()
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured properly',
        details: error
      }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const { source = 'linkedin_api' } = body

    console.log(`🔄 Syncing LinkedIn connections from ${source}`)

    // This would integrate with your existing LinkedIn connection sync
    // For now, return a placeholder response
    
    return NextResponse.json({
      success: true,
      message: 'Connection sync started',
      data: {
        syncId: `sync-${Date.now()}`,
        source,
        status: 'in_progress',
        note: 'Connection sync integration pending - use existing sync endpoints'
      }
    })

  } catch (error: any) {
    console.error('Error syncing connections:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to sync connections',
      details: error.message
    }, { status: 500 })
  }
}

// Apply authentication middleware
export const GET = withUserAuth(getHandler)
export const POST = withUserAuth(postHandler)