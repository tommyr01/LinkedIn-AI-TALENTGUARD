import { NextRequest, NextResponse } from 'next/server'
import { connectionIntelligenceService } from '@/lib/connection-intelligence-service'
import { isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for intelligence research

/**
 * POST /api/intelligence/research
 * Generate comprehensive intelligence profile for a single connection
 */
export async function POST(request: NextRequest) {
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
    const { connectionId } = body

    if (!connectionId) {
      return NextResponse.json({
        success: false,
        error: 'Connection ID is required'
      }, { status: 400 })
    }

    console.log(`🔍 Starting intelligence research for connection: ${connectionId}`)

    // Generate comprehensive intelligence profile
    const intelligenceProfile = await connectionIntelligenceService.generateIntelligenceProfile(connectionId)

    console.log(`✅ Intelligence research completed for ${intelligenceProfile.connectionName}`, {
      overallExpertise: intelligenceProfile.unifiedScores.overallExpertise,
      verificationStatus: intelligenceProfile.intelligenceAssessment.verificationStatus,
      researchDuration: intelligenceProfile.researchDuration
    })

    return NextResponse.json({
      success: true,
      message: `Intelligence profile generated for ${intelligenceProfile.connectionName}`,
      data: {
        profile: intelligenceProfile,
        summary: {
          connectionName: intelligenceProfile.connectionName,
          company: intelligenceProfile.company,
          overallExpertise: intelligenceProfile.unifiedScores.overallExpertise,
          verificationStatus: intelligenceProfile.intelligenceAssessment.verificationStatus,
          confidenceLevel: intelligenceProfile.intelligenceAssessment.confidenceLevel,
          strengths: intelligenceProfile.intelligenceAssessment.strengths,
          recommendations: intelligenceProfile.intelligenceAssessment.recommendations,
          researchDuration: intelligenceProfile.researchDuration
        }
      }
    })

  } catch (error: any) {
    console.error('Error in intelligence research:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Intelligence research failed',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/intelligence/research?connectionId=xxx
 * Get existing intelligence profile for a connection
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({
        success: false,
        error: 'Connection ID is required'
      }, { status: 400 })
    }

    // For now, we'd need to implement a method to retrieve existing profiles
    // This would query the connection_intelligence_profiles table
    console.log(`📊 Retrieving intelligence profile for connection: ${connectionId}`)

    // Mock response structure for now
    return NextResponse.json({
      success: true,
      message: 'Intelligence profile retrieval (not yet implemented)',
      data: {
        connectionId,
        status: 'not_implemented',
        note: 'Profile retrieval will be implemented with database integration'
      }
    })

  } catch (error: any) {
    console.error('Error retrieving intelligence profile:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve intelligence profile',
      details: error.message
    }, { status: 500 })
  }
}