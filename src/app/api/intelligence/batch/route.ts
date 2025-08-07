import { NextRequest, NextResponse } from 'next/server'
import { connectionIntelligenceService, BatchResearchRequest } from '@/lib/connection-intelligence-service'
import { isIntelligenceSupabaseConfigured, validateIntelligenceSupabaseConfig } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 600 // 10 minutes for batch processing (Vercel limit)

/**
 * POST /api/intelligence/batch
 * Process multiple connections for intelligence research in batch
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}))
    const { 
      connectionIds, 
      priorityOrder = 'random', 
      maxConcurrency = 2 
    } = body

    // Validation
    if (!connectionIds || !Array.isArray(connectionIds) || connectionIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Connection IDs array is required and must not be empty'
      }, { status: 400 })
    }

    if (connectionIds.length > 20) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 20 connections allowed per batch request'
      }, { status: 400 })
    }

    const validPriorityOrders = ['expertise_potential', 'engagement_level', 'company_relevance', 'random']
    if (!validPriorityOrders.includes(priorityOrder)) {
      return NextResponse.json({
        success: false,
        error: `Invalid priority order. Must be one of: ${validPriorityOrders.join(', ')}`
      }, { status: 400 })
    }

    if (maxConcurrency < 1 || maxConcurrency > 3) {
      return NextResponse.json({
        success: false,
        error: 'Max concurrency must be between 1 and 3'
      }, { status: 400 })
    }

    console.log(`🔄 Starting batch intelligence research for ${connectionIds.length} connections`)

    const batchRequest: BatchResearchRequest = {
      connectionIds,
      priorityOrder,
      maxConcurrency
    }

    // Process the batch
    const batchResult = await connectionIntelligenceService.processBatch(batchRequest)

    console.log(`✅ Batch intelligence research completed`, {
      requestId: batchResult.requestId,
      totalConnections: batchResult.totalConnections,
      completed: batchResult.completed,
      failed: batchResult.failed,
      highValueProspects: batchResult.summary.highValueProspects
    })

    return NextResponse.json({
      success: true,
      message: `Batch intelligence research completed for ${batchResult.completed}/${batchResult.totalConnections} connections`,
      data: {
        batchResult,
        summary: {
          requestId: batchResult.requestId,
          processed: batchResult.completed,
          failed: batchResult.failed,
          highValueProspects: batchResult.summary.highValueProspects,
          averageExpertiseScore: batchResult.summary.averageExpertiseScore,
          topExpertiseAreas: batchResult.summary.topExpertiseAreas,
          successRate: Math.round((batchResult.completed / batchResult.totalConnections) * 100),
          processingErrors: batchResult.errors.length > 0 ? batchResult.errors.slice(0, 5) : [] // Show first 5 errors
        }
      }
    })

  } catch (error: any) {
    console.error('Error in batch intelligence research:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Batch intelligence research failed',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/intelligence/batch?requestId=xxx
 * Get status and results of a batch research request
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

    const searchParams = request.nextUrl.searchParams
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json({
        success: false,
        error: 'Request ID is required'
      }, { status: 400 })
    }

    console.log(`📊 Retrieving batch research status for: ${requestId}`)

    // For now, this would query the batch_research_requests table
    // This would be implemented with the database integration
    
    return NextResponse.json({
      success: true,
      message: 'Batch status retrieval (not yet implemented)',
      data: {
        requestId,
        status: 'not_implemented',
        note: 'Batch status retrieval will be implemented with database integration'
      }
    })

  } catch (error: any) {
    console.error('Error retrieving batch research status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve batch research status',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE /api/intelligence/batch
 * Cancel a running batch research request
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json({
        success: false,
        error: 'Request ID is required'
      }, { status: 400 })
    }

    console.log(`🛑 Canceling batch research request: ${requestId}`)

    // This would implement cancellation logic
    // For now, just return a placeholder response
    
    return NextResponse.json({
      success: true,
      message: 'Batch research cancellation (not yet implemented)',
      data: {
        requestId,
        status: 'not_implemented',
        note: 'Batch cancellation will be implemented with proper queue management'
      }
    })

  } catch (error: any) {
    console.error('Error canceling batch research:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel batch research',
      details: error.message
    }, { status: 500 })
  }
}