import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput, toneProfileUpdateSchema } from '../../../../../lib/validation'
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

// Helper function to verify tone profile ownership
async function verifyProfileOwnership(supabase: any, profileId: string, userId: string) {
  const { data: profile, error } = await supabase
    .from('tone_profiles')
    .select('id, user_id, name, is_active')
    .eq('id', profileId)
    .single()

  if (error || !profile) {
    return { error: 'Tone profile not found', status: 404 }
  }

  if (profile.user_id !== userId) {
    return { error: 'Access denied: tone profile belongs to another user', status: 403 }
  }

  if (!profile.is_active) {
    return { error: 'Tone profile has been deactivated', status: 410 }
  }

  return { profile }
}

// GET - Fetch specific tone profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { id: profileId } = params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify ownership and get profile
    const ownershipResult = await verifyProfileOwnership(supabase, profileId, user.id)
    if ('error' in ownershipResult) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status })
    }

    // Fetch detailed profile data
    const { data: profile, error } = await supabase
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
      .eq('id', profileId)
      .single()

    if (error) {
      console.error('Error fetching tone profile:', error)
      return NextResponse.json({
        error: 'Failed to fetch tone profile',
        details: error.message
      }, { status: 500 })
    }

    // Get usage analytics for this profile
    const { data: analytics } = await supabase
      .from('tone_profile_analytics')
      .select('*')
      .eq('id', profileId)
      .single()

    // Get recent usage history (last 10 uses)
    const { data: recentUsage } = await supabase
      .from('tone_profile_usage')
      .select(`
        id,
        usage_context,
        user_satisfaction_rating,
        edit_count,
        was_used,
        used_at
      `)
      .eq('tone_profile_id', profileId)
      .order('used_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: profile,
      analytics: analytics || null,
      recent_usage: recentUsage || []
    })

  } catch (error: any) {
    console.error('Error in GET tone profile:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update tone profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { id: profileId } = params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify ownership
    const ownershipResult = await verifyProfileOwnership(supabase, profileId, user.id)
    if ('error' in ownershipResult) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status })
    }

    // Validate request body
    const body = await request.json()
    const validationResult = validateInput(toneProfileUpdateSchema, { ...body, id: profileId })

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid tone profile data',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const updateData = validationResult.data!
    const { id: _, ...dataToUpdate } = updateData // Remove id from update data

    // If this is being set as default, unset other default profiles
    if (dataToUpdate.is_default === true) {
      await supabase
        .from('tone_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
        .neq('id', profileId)
    }

    // Increment version number
    const { data: currentProfile } = await supabase
      .from('tone_profiles')
      .select('version')
      .eq('id', profileId)
      .single()

    const newVersion = (currentProfile?.version || 1) + 1

    // Update the profile
    const { data: updatedProfile, error } = await supabase
      .from('tone_profiles')
      .update({
        ...dataToUpdate,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tone profile:', error)
      return NextResponse.json({
        error: 'Failed to update tone profile',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Tone profile updated:', profileId, 'version:', newVersion)

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Tone profile updated successfully'
    })

  } catch (error: any) {
    console.error('Error in PUT tone profile:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete specific tone profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { id: profileId } = params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify ownership
    const ownershipResult = await verifyProfileOwnership(supabase, profileId, user.id)
    if ('error' in ownershipResult) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status })
    }

    const { profile } = ownershipResult

    // Check if this is the user's only profile
    const { count } = await supabase
      .from('tone_profiles')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if ((count || 0) <= 1) {
      return NextResponse.json({
        error: 'Cannot delete last tone profile',
        details: 'You must have at least one active tone profile. Please create a new one before deleting this one.'
      }, { status: 400 })
    }

    // Soft delete (preserve usage history)
    const { error } = await supabase
      .from('tone_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)

    if (error) {
      console.error('Error deleting tone profile:', error)
      return NextResponse.json({
        error: 'Failed to delete tone profile',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Tone profile deactivated:', profileId)

    return NextResponse.json({
      success: true,
      message: `Tone profile "${profile.name}" deleted successfully`
    })

  } catch (error: any) {
    console.error('Error in DELETE tone profile:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PATCH - Quick actions (set as default, duplicate, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { id: profileId } = params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify ownership
    const ownershipResult = await verifyProfileOwnership(supabase, profileId, user.id)
    if ('error' in ownershipResult) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status })
    }

    const { profile } = ownershipResult
    const { action } = await request.json()

    switch (action) {
      case 'set_default':
        // Unset current default
        await supabase
          .from('tone_profiles')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)

        // Set this as default
        const { error: setDefaultError } = await supabase
          .from('tone_profiles')
          .update({ 
            is_default: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId)

        if (setDefaultError) {
          throw setDefaultError
        }

        return NextResponse.json({
          success: true,
          message: `"${profile.name}" is now your default tone profile`
        })

      case 'duplicate':
        // Get full profile data
        const { data: sourceProfile } = await supabase
          .from('tone_profiles')
          .select('*')
          .eq('id', profileId)
          .single()

        if (!sourceProfile) {
          return NextResponse.json({ error: 'Source profile not found' }, { status: 404 })
        }

        // Check profile limit
        const { count } = await supabase
          .from('tone_profiles')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)

        if ((count || 0) >= 10) {
          return NextResponse.json({
            error: 'Maximum number of tone profiles reached',
            details: 'You can have up to 10 active tone profiles.'
          }, { status: 400 })
        }

        // Create duplicate
        const duplicateData = {
          user_id: user.id,
          name: `${sourceProfile.name} (Copy)`,
          description: sourceProfile.description,
          formality_level: sourceProfile.formality_level,
          communication_style: sourceProfile.communication_style,
          personality_traits: sourceProfile.personality_traits,
          industry_language: sourceProfile.industry_language,
          custom_elements: sourceProfile.custom_elements,
          sample_phrases: sourceProfile.sample_phrases,
          avoid_words: sourceProfile.avoid_words,
          preferred_greetings: sourceProfile.preferred_greetings,
          preferred_closings: sourceProfile.preferred_closings,
          ai_temperature: sourceProfile.ai_temperature,
          ai_max_tokens: sourceProfile.ai_max_tokens,
          ai_model: sourceProfile.ai_model,
          is_default: false, // Never default for duplicates
          is_active: true,
          version: 1
        }

        const { data: duplicatedProfile, error: duplicateError } = await supabase
          .from('tone_profiles')
          .insert(duplicateData)
          .select()
          .single()

        if (duplicateError) {
          throw duplicateError
        }

        return NextResponse.json({
          success: true,
          data: duplicatedProfile,
          message: `Tone profile duplicated as "${duplicatedProfile.name}"`
        })

      default:
        return NextResponse.json({
          error: 'Invalid action',
          details: 'Supported actions: set_default, duplicate'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error in PATCH tone profile:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}