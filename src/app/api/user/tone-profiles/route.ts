import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput, toneProfileCreateSchema } from '@/lib/validation'
import { validateSession } from '@/lib/auth'

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

// GET - Fetch user's tone profiles
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeUsage = searchParams.get('include_usage') === 'true'
    const includeTemplates = searchParams.get('include_templates') === 'true'

    // Fetch tone profiles
    const { data: profiles, error } = await supabase
      .from('tone_profiles')
      .select(`
        id,
        name,
        description,
        formality_level,
        communication_style,
        personality_traits,
        industry_language,
        custom_elements,
        sample_phrases,
        avoid_words,
        preferred_greetings,
        preferred_closings,
        ai_temperature,
        ai_max_tokens,
        ai_model,
        usage_count,
        effectiveness_score,
        last_used_at,
        is_active,
        is_default,
        version,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('usage_count', { ascending: false })

    if (error) {
      console.error('Error fetching tone profiles:', error)
      return NextResponse.json({
        error: 'Failed to fetch tone profiles',
        details: error.message
      }, { status: 500 })
    }

    let response: any = {
      success: true,
      data: profiles || [],
      meta: {
        count: profiles?.length || 0,
        user_id: user.id
      }
    }

    // Include usage analytics if requested
    if (includeUsage && profiles && profiles.length > 0) {
      const profileIds = profiles.map(p => p.id)
      const { data: usageData } = await supabase
        .from('tone_profile_analytics')
        .select('*')
        .in('id', profileIds)

      response.analytics = usageData || []
    }

    // Include system templates if requested
    if (includeTemplates) {
      const { data: templates } = await supabase
        .from('tone_profile_templates')
        .select(`
          id,
          name,
          category,
          description,
          formality_level,
          communication_style,
          personality_traits,
          industry_language,
          custom_elements,
          sample_phrases,
          is_premium,
          usage_count,
          popularity_score
        `)
        .order('popularity_score', { ascending: false })
        .limit(10)

      response.templates = templates || []
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error in GET tone profiles:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new tone profile
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
    const validationResult = validateInput(toneProfileCreateSchema, body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid tone profile data',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const profileData = validationResult.data!

    // Check if user has reached the maximum number of profiles (10)
    const { count } = await supabase
      .from('tone_profiles')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if ((count || 0) >= 10) {
      return NextResponse.json({
        error: 'Maximum number of tone profiles reached',
        details: 'You can have up to 10 active tone profiles. Please delete or deactivate an existing profile first.'
      }, { status: 400 })
    }

    // If this is set as default, unset other default profiles
    if (profileData.is_default) {
      await supabase
        .from('tone_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
    }

    // Create the tone profile
    const { data: profile, error } = await supabase
      .from('tone_profiles')
      .insert({
        user_id: user.id,
        ...profileData
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tone profile:', error)
      return NextResponse.json({
        error: 'Failed to create tone profile',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Tone profile created:', profile.id)

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Tone profile created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in POST tone profiles:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Batch delete tone profiles
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    const searchParams = request.nextUrl.searchParams
    const profileIds = searchParams.get('ids')?.split(',').filter(id => id.trim())

    if (!profileIds || profileIds.length === 0) {
      return NextResponse.json({
        error: 'No profile IDs provided',
        details: 'Include profile IDs in the query parameter: ?ids=id1,id2,id3'
      }, { status: 400 })
    }

    if (profileIds.length > 10) {
      return NextResponse.json({
        error: 'Too many profiles to delete',
        details: 'Maximum 10 profiles can be deleted at once'
      }, { status: 400 })
    }

    // Soft delete (set is_active to false) instead of hard delete to preserve usage history
    const { data: deletedProfiles, error } = await supabase
      .from('tone_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .in('id', profileIds)
      .select('id, name')

    if (error) {
      console.error('Error deleting tone profiles:', error)
      return NextResponse.json({
        error: 'Failed to delete tone profiles',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ Deactivated ${deletedProfiles?.length || 0} tone profiles`)

    return NextResponse.json({
      success: true,
      data: {
        deleted_count: deletedProfiles?.length || 0,
        deleted_profiles: deletedProfiles || []
      },
      message: `Successfully deactivated ${deletedProfiles?.length || 0} tone profile(s)`
    })

  } catch (error: any) {
    console.error('Error in DELETE tone profiles:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}