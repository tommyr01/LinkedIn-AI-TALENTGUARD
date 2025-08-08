import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput, userPreferencesSchema } from '../../../../lib/validation'
import { validateSession } from '../../../../lib/auth'

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

// GET - Fetch user preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch user preferences from the auth table
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select(`
        tone_profiles,
        default_tone_profile_id,
        ai_settings,
        notification_settings,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user preferences:', error)
      return NextResponse.json({
        error: 'Failed to fetch user preferences',
        details: error.message
      }, { status: 500 })
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaultPreferences = {
        tone_profiles: [],
        default_tone_profile_id: null,
        ai_settings: {
          openai_model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000
        },
        notification_settings: {
          email_notifications: true,
          research_complete: true,
          batch_complete: true
        }
      }

      return NextResponse.json({
        success: true,
        data: defaultPreferences,
        meta: {
          user_id: user.id,
          is_default: true
        }
      })
    }

    // Also get the actual tone profiles from the new table
    const { data: actualToneProfiles } = await supabase
      .from('tone_profiles')
      .select(`
        id,
        name,
        formality_level,
        communication_style,
        personality_traits,
        industry_language,
        is_default,
        usage_count,
        last_used_at,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('usage_count', { ascending: false })

    // Merge legacy preferences with new structure
    const responseData = {
      ...preferences,
      actual_tone_profiles: actualToneProfiles || []
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        user_id: user.id,
        tone_profiles_count: actualToneProfiles?.length || 0,
        default_profile: actualToneProfiles?.find(p => p.is_default) || null
      }
    })

  } catch (error: any) {
    console.error('Error in GET user preferences:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate request body
    const body = await request.json()
    
    // Allow partial updates
    const allowedFields = [
      'default_tone_profile_id',
      'ai_settings', 
      'notification_settings'
    ]

    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        error: 'No valid fields to update',
        details: `Allowed fields: ${allowedFields.join(', ')}`
      }, { status: 400 })
    }

    // If updating default tone profile, verify it exists and belongs to user
    if (updateData.default_tone_profile_id) {
      const { data: toneProfile } = await supabase
        .from('tone_profiles')
        .select('id, name, is_active')
        .eq('id', updateData.default_tone_profile_id)
        .eq('user_id', user.id)
        .single()

      if (!toneProfile || !toneProfile.is_active) {
        return NextResponse.json({
          error: 'Invalid default tone profile',
          details: 'The specified tone profile does not exist or is not active'
        }, { status: 400 })
      }

      // Update the tone profile table as well
      await supabase
        .from('tone_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)

      await supabase
        .from('tone_profiles')
        .update({ is_default: true })
        .eq('id', updateData.default_tone_profile_id)
    }

    // Check if user preferences record exists
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existingPrefs) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Create new preferences record
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          tone_profiles: [],
          ...updateData
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error updating user preferences:', result.error)
      return NextResponse.json({
        error: 'Failed to update user preferences',
        details: result.error.message
      }, { status: 500 })
    }

    console.log('✅ User preferences updated for user:', user.id)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'User preferences updated successfully'
    })

  } catch (error: any) {
    console.error('Error in PUT user preferences:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PATCH - Quick preference updates (e.g., toggle notifications)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, value } = await request.json()

    if (!action) {
      return NextResponse.json({
        error: 'Action is required',
        details: 'Supported actions: set_default_tone_profile, toggle_email_notifications, toggle_research_notifications'
      }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case 'set_default_tone_profile':
        if (!value) {
          return NextResponse.json({
            error: 'Tone profile ID is required',
            details: 'Include the tone profile ID in the value field'
          }, { status: 400 })
        }

        // Verify tone profile ownership
        const { data: toneProfile } = await supabase
          .from('tone_profiles')
          .select('id, name, is_active')
          .eq('id', value)
          .eq('user_id', user.id)
          .single()

        if (!toneProfile || !toneProfile.is_active) {
          return NextResponse.json({
            error: 'Invalid tone profile',
            details: 'The specified tone profile does not exist or is not active'
          }, { status: 400 })
        }

        // Update tone profiles table
        await supabase
          .from('tone_profiles')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)

        await supabase
          .from('tone_profiles')
          .update({ is_default: true })
          .eq('id', value)

        updateData.default_tone_profile_id = value
        break

      case 'toggle_email_notifications':
        // Get current preferences
        const { data: currentPrefs } = await supabase
          .from('user_preferences')
          .select('notification_settings')
          .eq('user_id', user.id)
          .single()

        const currentNotifications = currentPrefs?.notification_settings || { email_notifications: true }
        updateData.notification_settings = {
          ...currentNotifications,
          email_notifications: !currentNotifications.email_notifications
        }
        break

      case 'toggle_research_notifications':
        const { data: currentResearchPrefs } = await supabase
          .from('user_preferences')
          .select('notification_settings')
          .eq('user_id', user.id)
          .single()

        const currentResearchNotifications = currentResearchPrefs?.notification_settings || { research_complete: true }
        updateData.notification_settings = {
          ...currentResearchNotifications,
          research_complete: !currentResearchNotifications.research_complete
        }
        break

      default:
        return NextResponse.json({
          error: 'Invalid action',
          details: 'Supported actions: set_default_tone_profile, toggle_email_notifications, toggle_research_notifications'
        }, { status: 400 })
    }

    // Update preferences
    const { data: updatedPrefs, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...updateData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return NextResponse.json({
        error: 'Failed to update preferences',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedPrefs,
      message: `Successfully updated: ${action.replace(/_/g, ' ')}`
    })

  } catch (error: any) {
    console.error('Error in PATCH user preferences:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}