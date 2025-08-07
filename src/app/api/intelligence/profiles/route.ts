import { NextRequest, NextResponse } from 'next/server'
import { supabaseLinkedIn } from '@/lib/supabase-linkedin'
import { isIntelligenceSupabaseConfigured, validateIntelligenceSupabaseConfig } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/intelligence/profiles
 * Get all intelligence profiles or specific profile by connection ID
 */
export async function GET(request: NextRequest) {
  try {
    // Validate Intelligence Supabase configuration
    if (!isIntelligenceSupabaseConfigured()) {
      const { error } = validateIntelligenceSupabaseConfig()
      return NextResponse.json({
        success: false,
        error: 'Intelligence Supabase configuration incomplete',
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
    const connectionId = searchParams.get('connectionId')

    if (connectionId) {
      // Get specific intelligence profile
      console.log(`📊 Retrieving intelligence profile for connection: ${connectionId}`)
      
      const profile = await supabaseLinkedIn.getIntelligenceProfile(connectionId)
      
      if (!profile) {
        return NextResponse.json({
          success: false,
          error: 'Intelligence profile not found',
          data: null
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: 'Intelligence profile retrieved successfully',
        data: { profile }
      })

    } else {
      // Get all intelligence profiles
      console.log('📊 Retrieving all intelligence profiles')
      
      const profiles = await supabaseLinkedIn.getAllIntelligenceProfiles()
      
      return NextResponse.json({
        success: true,
        message: `Retrieved ${profiles.length} intelligence profiles`,
        data: { 
          profiles,
          count: profiles.length,
          highValueProspects: profiles.filter(p => (p.unifiedScores?.overallExpertise ?? 0) > 70).length,
          verifiedExperts: profiles.filter(p => p.intelligenceAssessment?.verificationStatus === 'verified').length
        }
      })
    }

  } catch (error: any) {
    console.error('Error retrieving intelligence profiles:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve intelligence profiles',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE /api/intelligence/profiles
 * Delete intelligence profile by connection ID
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validate Intelligence Supabase configuration
    if (!isIntelligenceSupabaseConfigured()) {
      const { error } = validateIntelligenceSupabaseConfig()
      return NextResponse.json({
        success: false,
        error: 'Intelligence Supabase configuration incomplete',
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
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({
        success: false,
        error: 'Connection ID is required'
      }, { status: 400 })
    }

    console.log(`🗑️ Deleting intelligence profile for connection: ${connectionId}`)

    await supabaseLinkedIn.deleteIntelligenceProfile(connectionId)

    return NextResponse.json({
      success: true,
      message: 'Intelligence profile deleted successfully',
      data: { connectionId }
    })

  } catch (error: any) {
    console.error('Error deleting intelligence profile:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete intelligence profile',
      details: error.message
    }, { status: 500 })
  }
}