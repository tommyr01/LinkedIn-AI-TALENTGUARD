import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput, toneProfileCreateSchema } from '../../../../../lib/validation'
import { validateSession } from '../../../../../lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Helper function to get authenticated user (optional for templates)
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null // Allow anonymous access to templates
  }

  const token = authHeader.slice(7)
  const sessionData = await validateSession(token)
  
  return sessionData ? { user: sessionData.user, sessionId: sessionData.sessionId } : null
}

// GET - Fetch tone profile templates
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const searchParams = request.nextUrl.searchParams
    
    const category = searchParams.get('category')
    const isPremium = searchParams.get('premium') === 'true'
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))

    let query = supabase
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
        popularity_score,
        created_at
      `)
      .order('popularity_score', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    if (isPremium !== null) {
      query = query.eq('is_premium', isPremium)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching tone profile templates:', error)
      return NextResponse.json({
        error: 'Failed to fetch templates',
        details: error.message
      }, { status: 500 })
    }

    // Get unique categories for filtering
    const { data: categories } = await supabase
      .from('tone_profile_templates')
      .select('category')

    const uniqueCategories = Array.from(new Set(categories?.map(c => c.category) || []))

    return NextResponse.json({
      success: true,
      data: templates || [],
      meta: {
        count: templates?.length || 0,
        categories: uniqueCategories,
        filters: {
          category,
          premium: isPremium,
          limit
        }
      }
    })

  } catch (error: any) {
    console.error('Error in GET tone profile templates:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create tone profile from template
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if (!authResult) {
      return NextResponse.json({ 
        error: 'Authentication required to create tone profiles from templates' 
      }, { status: 401 })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { templateId, customizations = {} } = await request.json()

    if (!templateId) {
      return NextResponse.json({
        error: 'Template ID is required',
        details: 'Include templateId in the request body'
      }, { status: 400 })
    }

    // Get template data
    const { data: template, error: templateError } = await supabase
      .from('tone_profile_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({
        error: 'Template not found',
        details: templateError?.message || 'Invalid template ID'
      }, { status: 404 })
    }

    // Check user's profile limit
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

    // Create profile data from template with customizations
    const profileData = {
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      formality_level: customizations.formality_level || template.formality_level,
      communication_style: customizations.communication_style || template.communication_style,
      personality_traits: customizations.personality_traits || template.personality_traits,
      industry_language: customizations.industry_language || template.industry_language,
      custom_elements: customizations.custom_elements || template.custom_elements,
      sample_phrases: customizations.sample_phrases || template.sample_phrases || [],
      avoid_words: customizations.avoid_words || [],
      preferred_greetings: customizations.preferred_greetings || [],
      preferred_closings: customizations.preferred_closings || [],
      ai_temperature: customizations.ai_temperature ?? 0.7,
      ai_max_tokens: customizations.ai_max_tokens ?? 1000,
      ai_model: customizations.ai_model || 'gpt-4',
      is_default: customizations.is_default || false
    }

    // Validate the profile data
    const validationResult = validateInput(toneProfileCreateSchema, profileData)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid profile data from template',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const validatedData = validationResult.data!

    // If this is set as default, unset other default profiles
    if (validatedData.is_default) {
      await supabase
        .from('tone_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
    }

    // Create the tone profile
    const { data: profile, error: createError } = await supabase
      .from('tone_profiles')
      .insert({
        user_id: user.id,
        ...validatedData
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating tone profile from template:', createError)
      return NextResponse.json({
        error: 'Failed to create tone profile from template',
        details: createError.message
      }, { status: 500 })
    }

    // Update template usage count
    await supabase
      .from('tone_profile_templates')
      .update({ 
        usage_count: template.usage_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)

    console.log('✅ Tone profile created from template:', profile.id, 'template:', templateId)

    return NextResponse.json({
      success: true,
      data: profile,
      template: {
        id: template.id,
        name: template.name,
        category: template.category
      },
      message: `Tone profile "${profile.name}" created from template successfully`
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in POST tone profile from template:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}