import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput, commentGenerationSchema } from '@/lib/validation'
import { validateSession } from '@/lib/auth'
import { OpenAI } from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

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

// Helper function to get tone profile
async function getToneProfile(supabase: any, userId: string, toneProfileId?: string) {
  if (!toneProfileId) {
    // Get user's default tone profile
    const { data: defaultProfile } = await supabase
      .from('tone_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_default', true)
      .single()

    return defaultProfile
  }

  // Get specific tone profile
  const { data: profile } = await supabase
    .from('tone_profiles')
    .select('*')
    .eq('id', toneProfileId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  return profile
}

// Helper function to build AI prompt with tone considerations
function buildToneAwarePrompt(
  postContent: string,
  toneProfile: any,
  targetAudience: string,
  commentStyle: string,
  maxLength: number,
  includeQuestion: boolean
): string {
  const basePrompt = `You are generating a thoughtful LinkedIn comment in response to this post:

POST: "${postContent}"

TONE PROFILE SETTINGS:
- Formality Level: ${toneProfile?.formality_level || 'professional'}
- Communication Style: ${toneProfile?.communication_style || 'collaborative'}
- Personality Traits: ${toneProfile?.personality_traits?.join(', ') || 'supportive, analytical'}
- Industry Language: ${toneProfile?.industry_language || 'general'}

TARGET AUDIENCE: ${targetAudience}
COMMENT STYLE: ${commentStyle}
MAX LENGTH: ${maxLength} characters
${includeQuestion ? 'INCLUDE A THOUGHTFUL QUESTION' : 'NO QUESTION REQUIRED'}

CUSTOM INSTRUCTIONS: ${toneProfile?.custom_elements || 'None'}

${toneProfile?.sample_phrases?.length ? `EXAMPLE PHRASES TO CONSIDER: ${JSON.stringify(toneProfile.sample_phrases)}` : ''}

${toneProfile?.avoid_words?.length ? `AVOID THESE WORDS/PHRASES: ${toneProfile.avoid_words.join(', ')}` : ''}

${toneProfile?.preferred_greetings?.length ? `PREFERRED GREETINGS: ${toneProfile.preferred_greetings.join(', ')}` : ''}

${toneProfile?.preferred_closings?.length ? `PREFERRED CLOSINGS: ${toneProfile.preferred_closings.join(', ')}` : ''}

REQUIREMENTS:
1. Write a genuine, engaging comment that adds value to the conversation
2. Match the specified tone profile characteristics exactly
3. Keep within the character limit
4. Make it sound natural and human
5. Avoid being overly promotional or salesy
6. Focus on building genuine professional relationships

Generate ONLY the comment text, no additional formatting or explanation.`

  return basePrompt
}

// POST - Generate AI comment with tone profile
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'AI service not configured',
        details: 'OpenAI API key is not configured'
      }, { status: 503 })
    }

    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Validate request body
    const body = await request.json()
    const validationResult = validateInput(commentGenerationSchema, body)

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid comment generation request',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const {
      post_content,
      target_audience = 'hr_professionals',
      comment_style = 'supportive',
      tone_profile_id,
      max_length = 200,
      include_question = false
    } = validationResult.data!

    console.log('🤖 Generating AI comment with tone profile for user:', user.id)

    // Get tone profile
    const toneProfile = await getToneProfile(supabase, user.id, tone_profile_id)
    
    if (!toneProfile) {
      return NextResponse.json({
        error: 'No tone profile found',
        details: 'Please create a tone profile or check that the specified profile exists and is active'
      }, { status: 400 })
    }

    console.log('🎭 Using tone profile:', toneProfile.name)

    // Build AI prompt
    const prompt = buildToneAwarePrompt(
      post_content,
      toneProfile,
      target_audience,
      comment_style,
      max_length,
      include_question
    )

    // Generate comment using OpenAI
    const completion = await openai.chat.completions.create({
      model: toneProfile.ai_model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn engagement specialist who creates authentic, valuable comments that build professional relationships.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: toneProfile.ai_temperature || 0.7,
      max_tokens: Math.min(toneProfile.ai_max_tokens || 1000, 500), // Cap for comments
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const generatedContent = completion.choices[0]?.message?.content?.trim()

    if (!generatedContent) {
      throw new Error('OpenAI did not return any content')
    }

    const responseTime = Date.now() - startTime
    const tokenUsage = completion.usage?.total_tokens || 0

    console.log('✅ Comment generated successfully:', {
      length: generatedContent.length,
      tokens: tokenUsage,
      responseTime: `${responseTime}ms`
    })

    // Log generation to history
    try {
      await supabase
        .from('ai_generation_history')
        .insert({
          user_id: user.id,
          tone_profile_id: toneProfile.id,
          request_type: 'linkedin_comment',
          input_context: JSON.stringify({
            post_content: post_content.substring(0, 500),
            target_audience,
            comment_style,
            max_length,
            include_question
          }),
          ai_model_used: toneProfile.ai_model || 'gpt-4',
          ai_temperature: toneProfile.ai_temperature || 0.7,
          ai_max_tokens: Math.min(toneProfile.ai_max_tokens || 1000, 500),
          generated_content: generatedContent,
          response_time_ms: responseTime,
          token_usage: tokenUsage,
          quality_score: Math.min(100, 90 - (generatedContent.length > max_length ? 20 : 0))
        })
        
      console.log('📊 Generation logged to history')
    } catch (historyError) {
      console.warn('⚠️ Failed to log generation history:', historyError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      data: {
        generated_comment: generatedContent,
        length: generatedContent.length,
        tone_profile: {
          id: toneProfile.id,
          name: toneProfile.name,
          formality_level: toneProfile.formality_level,
          communication_style: toneProfile.communication_style
        },
        generation_meta: {
          model_used: toneProfile.ai_model || 'gpt-4',
          temperature: toneProfile.ai_temperature || 0.7,
          response_time_ms: responseTime,
          token_usage: tokenUsage,
          target_audience,
          comment_style,
          included_question: include_question
        }
      },
      message: 'Comment generated successfully with tone profile'
    })

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    console.error('Error generating AI comment:', error)

    // Handle specific OpenAI errors
    if (error?.status === 429) {
      return NextResponse.json({
        error: 'AI service rate limit exceeded',
        details: 'Please wait a moment before generating another comment',
        retry_after: 60
      }, { status: 429 })
    }

    if (error?.status === 401) {
      return NextResponse.json({
        error: 'AI service authentication failed',
        details: 'OpenAI API key is invalid or expired'
      }, { status: 503 })
    }

    if (error?.message?.includes('content_policy_violation')) {
      return NextResponse.json({
        error: 'Content policy violation',
        details: 'The generated content was filtered due to policy violations. Please try rephrasing your request.'
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to generate comment',
      details: error.message,
      response_time_ms: responseTime
    }, { status: 500 })
  }
}

// GET - Test endpoint and get generation statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user's tone profiles
    const { data: toneProfiles } = await supabase
      .from('tone_profiles')
      .select('id, name, usage_count, is_default')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })

    // Get generation statistics
    const { data: generationStats } = await supabase
      .from('ai_generation_history')
      .select('id, ai_model_used, created_at')
      .eq('user_id', user.id)
      .eq('request_type', 'linkedin_comment')
      .order('created_at', { ascending: false })
      .limit(100)

    const stats = {
      total_generations: generationStats?.length || 0,
      this_month: generationStats?.filter(g => 
        new Date(g.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0,
      models_used: Array.from(new Set(generationStats?.map(g => g.ai_model_used) || [])),
      recent_generation: generationStats?.[0]?.created_at || null
    }

    return NextResponse.json({
      success: true,
      service_status: 'active',
      openai_configured: !!process.env.OPENAI_API_KEY,
      user_stats: stats,
      tone_profiles: toneProfiles || [],
      capabilities: [
        'Tone-aware comment generation',
        'Multiple AI models support',
        'Customizable personality traits',
        'Industry-specific language',
        'Usage analytics',
        'Generation history'
      ]
    })

  } catch (error: any) {
    console.error('Error in GET AI comment generation:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}