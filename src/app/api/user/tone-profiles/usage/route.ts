import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput, toneProfileUsageSchema } from '../../../../../lib/validation'
import { validateSession } from '../../../../../lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 }
  }

  const token = authHeader.slice(7)
  const sessionData = await validateSession(token)
  
  if (!sessionData) {
    return { error: 'Invalid or expired token', status: 401 }
  }

  return { user: sessionData.user, sessionId: sessionData.sessionId }
}

// POST - Track tone profile usage
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate request body
    const body = await request.json()
    const validationResult = validateInput(toneProfileUsageSchema, body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid usage tracking data',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const usageData = validationResult.data!

    // Verify tone profile ownership
    const { data: toneProfile, error: profileError } = await supabase
      .from('tone_profiles')
      .select('id, name, user_id, is_active')
      .eq('id', usageData.tone_profile_id)
      .single()

    if (profileError || !toneProfile) {
      return NextResponse.json({
        error: 'Tone profile not found',
        details: profileError?.message || 'Invalid tone profile ID'
      }, { status: 404 })
    }

    if (toneProfile.user_id !== user.id) {
      return NextResponse.json({
        error: 'Access denied',
        details: 'This tone profile belongs to another user'
      }, { status: 403 })
    }

    if (!toneProfile.is_active) {
      return NextResponse.json({
        error: 'Tone profile is inactive',
        details: 'Cannot track usage for deactivated tone profiles'
      }, { status: 400 })
    }

    // Calculate content metrics
    const contentLength = usageData.generated_content.length
    const editCount = usageData.edit_count || 0
    
    // Simple quality score calculation based on user satisfaction and edit count
    const qualityScore = usageData.user_satisfaction_rating ? 
      (usageData.user_satisfaction_rating * 20) - (editCount * 2) : null

    // Record usage
    const { data: usage, error: usageError } = await supabase
      .from('tone_profile_usage')
      .insert({
        tone_profile_id: usageData.tone_profile_id,
        user_id: user.id,
        usage_context: usageData.usage_context,
        original_prompt: usageData.original_prompt,
        generated_content: usageData.generated_content,
        final_content: usageData.final_content,
        content_length: contentLength,
        user_satisfaction_rating: usageData.user_satisfaction_rating,
        edit_count: editCount,
        was_used: usageData.was_used,
        feedback_notes: usageData.feedback_notes,
        used_at: new Date().toISOString()
      })
      .select()
      .single()

    if (usageError) {
      console.error('Error recording tone profile usage:', usageError)
      return NextResponse.json({
        error: 'Failed to record usage',
        details: usageError.message
      }, { status: 500 })
    }

    // Update effectiveness score for the tone profile (running average)
    if (usageData.user_satisfaction_rating && usageData.was_used) {
      const { data: profileAnalytics } = await supabase
        .from('tone_profile_analytics')
        .select('avg_satisfaction, total_generations')
        .eq('id', usageData.tone_profile_id)
        .single()

      if (profileAnalytics) {
        const currentAvg = profileAnalytics.avg_satisfaction || 0
        const totalGens = profileAnalytics.total_generations || 0
        const newAvg = ((currentAvg * totalGens) + (usageData.user_satisfaction_rating * 20)) / (totalGens + 1)
        
        await supabase
          .from('tone_profiles')
          .update({
            effectiveness_score: Math.round(newAvg * 100) / 100, // Round to 2 decimal places
            updated_at: new Date().toISOString()
          })
          .eq('id', usageData.tone_profile_id)
      }
    }

    console.log('✅ Tone profile usage recorded:', usage.id)

    return NextResponse.json({
      success: true,
      data: usage,
      analytics: {
        content_length: contentLength,
        edit_count: editCount,
        quality_score: qualityScore,
        usage_context: usageData.usage_context
      },
      message: 'Usage tracked successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in POST tone profile usage:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// GET - Fetch usage analytics
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    const searchParams = request.nextUrl.searchParams
    const toneProfileId = searchParams.get('tone_profile_id')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    const context = searchParams.get('context')
    const dateFrom = searchParams.get('date_from')

    // Base query for user's usage data
    let query = supabase
      .from('tone_profile_usage')
      .select(`
        id,
        tone_profile_id,
        usage_context,
        content_length,
        user_satisfaction_rating,
        edit_count,
        was_used,
        feedback_notes,
        used_at,
        tone_profiles!inner(name, formality_level, communication_style)
      `)
      .eq('user_id', user.id)
      .order('used_at', { ascending: false })
      .limit(limit)

    if (toneProfileId) {
      query = query.eq('tone_profile_id', toneProfileId)
    }

    if (context) {
      query = query.eq('usage_context', context)
    }

    if (dateFrom) {
      query = query.gte('used_at', dateFrom)
    }

    const { data: usageHistory, error } = await query

    if (error) {
      console.error('Error fetching usage analytics:', error)
      return NextResponse.json({
        error: 'Failed to fetch usage analytics',
        details: error.message
      }, { status: 500 })
    }

    // Calculate aggregate statistics
    const stats = {
      total_uses: usageHistory?.length || 0,
      successful_uses: usageHistory?.filter(u => u.was_used).length || 0,
      average_satisfaction: usageHistory?.length ? 
        usageHistory.reduce((sum, u) => sum + (u.user_satisfaction_rating || 0), 0) / usageHistory.length : 0,
      average_edit_count: usageHistory?.length ?
        usageHistory.reduce((sum, u) => sum + (u.edit_count || 0), 0) / usageHistory.length : 0,
      contexts_used: Array.from(new Set(usageHistory?.map(u => u.usage_context) || [])),
      success_rate: usageHistory?.length ? 
        (usageHistory.filter(u => u.was_used).length / usageHistory.length) * 100 : 0
    }

    // Get tone profile summary statistics
    const { data: profileStats } = await supabase
      .from('tone_profile_analytics')
      .select('*')
      .in('id', Array.from(new Set(usageHistory?.map(u => u.tone_profile_id) || [])))

    return NextResponse.json({
      success: true,
      data: usageHistory || [],
      statistics: stats,
      profile_analytics: profileStats || [],
      meta: {
        user_id: user.id,
        filters: {
          tone_profile_id: toneProfileId,
          context,
          date_from: dateFrom,
          limit
        }
      }
    })

  } catch (error: any) {
    console.error('Error in GET usage analytics:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}