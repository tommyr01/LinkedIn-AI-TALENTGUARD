import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateInput } from '../../../../lib/validation'
import { extractUsernameFromLinkedInUrl } from '../../../../lib/linkedin-scraper'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema for adding connections from prospects
const addConnectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  role: z.string().max(200, 'Role too long').optional(),
  company: z.string().max(200, 'Company name too long').optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').refine(
    (url) => url.includes('linkedin.com/in/'),
    'Must be a valid LinkedIn profile URL'
  ),
  headline: z.string().max(300, 'Headline too long').optional(),
  icpScore: z.number().min(0).max(100).optional(),
  icpCategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  location: z.string().max(200, 'Location too long').optional(),
  source: z.string().default('linkedin-comment'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('➕ Adding prospect to connections...')

    // Validate request body
    const body = await request.json()
    const validationResult = validateInput(addConnectionSchema, body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const { name, role, company, linkedinUrl, headline, icpScore, icpCategory, tags, location, source } = validationResult.data!

    // Extract username from LinkedIn URL
    const username = extractUsernameFromLinkedInUrl(linkedinUrl)
    if (!username) {
      return NextResponse.json({ 
        error: 'Invalid LinkedIn profile URL format' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('linkedin_connections')
      .select('id, full_name, username')
      .eq('username', username)
      .single()

    if (existingConnection) {
      console.log('🔄 Connection already exists, updating information...')
      
      // Update existing connection with new information
      const updateData: any = {
        full_name: name,
        title: role || existingConnection.title || '',
        current_company: company || existingConnection.current_company || '',
        headline: headline || existingConnection.headline || '',
        last_synced_at: new Date().toISOString()
      }

      const { data: updatedConnection, error: updateError } = await supabase
        .from('linkedin_connections')
        .update(updateData)
        .eq('id', existingConnection.id)
        .select()
        .single()

      if (updateError) {
        console.error('Supabase update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update existing connection',
          details: updateError.message
        }, { status: 500 })
      }

      // Also create or update intelligence profile if ICP data is provided
      if (icpScore !== undefined && icpCategory) {
        await createOrUpdateIntelligenceProfile(supabase, updatedConnection.id, {
          name,
          company: company || '',
          role: role || '',
          linkedinUrl,
          icpScore,
          icpCategory,
          tags,
          source
        })
      }

      return NextResponse.json({
        success: true,
        connection: updatedConnection,
        message: 'Connection updated successfully',
        isNew: false
      })
    }

    // Create new connection
    console.log('✨ Creating new connection...')
    const [firstName, ...lastNameParts] = name.split(' ')
    const lastName = lastNameParts.join(' ')

    const connectionData = {
      full_name: name,
      first_name: firstName,
      last_name: lastName || '',
      username: username,
      headline: headline || '',
      profile_picture_url: '',
      about: '',
      full_location: location || '',
      is_creator: false,
      is_influencer: false,
      is_premium: false,
      follower_count: 0,
      connection_count: 0,
      current_company: company || '',
      title: role || '',
      last_synced_at: new Date().toISOString()
    }

    const { data: connection, error } = await supabase
      .from('linkedin_connections')
      .insert(connectionData)
      .select()
      .single()

    if (error) {
      console.error('Supabase insertion error:', error)
      return NextResponse.json({ 
        error: 'Failed to create connection',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Connection created successfully:', connection.id)

    // Create intelligence profile if ICP data is provided
    if (icpScore !== undefined && icpCategory) {
      await createOrUpdateIntelligenceProfile(supabase, connection.id, {
        name,
        company: company || '',
        role: role || '',
        linkedinUrl,
        icpScore,
        icpCategory,
        tags,
        source
      })
    }

    return NextResponse.json({
      success: true,
      connection,
      message: 'Connection created successfully',
      isNew: true
    })

  } catch (error: any) {
    console.error('Error adding connection:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// Helper function to create or update intelligence profile
async function createOrUpdateIntelligenceProfile(
  supabase: any, 
  connectionId: string, 
  data: {
    name: string
    company: string
    role: string
    linkedinUrl: string
    icpScore: number
    icpCategory: string
    tags: string[]
    source: string
  }
) {
  try {
    // Check if intelligence profile already exists
    const { data: existingProfile } = await supabase
      .from('connection_intelligence_profiles')
      .select('id')
      .eq('connection_id', connectionId)
      .single()

    const unifiedScores = {
      overallExpertise: data.icpScore,
      talentManagement: data.icpCategory === 'High Value' ? data.icpScore : Math.max(0, data.icpScore - 20),
      peopleDevelopment: data.icpCategory === 'High Value' ? data.icpScore : Math.max(0, data.icpScore - 15),
      hrTechnology: data.icpCategory === 'High Value' ? data.icpScore : Math.max(0, data.icpScore - 10),
      leadership: data.icpCategory === 'High Value' ? data.icpScore : Math.max(0, data.icpScore - 25)
    }

    const profileData = {
      connection_id: connectionId,
      connection_name: data.name,
      company: data.company,
      title: data.role,
      profile_url: data.linkedinUrl,
      unified_scores: unifiedScores,
      data_quality: data.icpScore > 80 ? 'high' : data.icpScore > 60 ? 'medium' : 'low',
      confidence_level: Math.min(100, data.icpScore + 10),
      verification_status: data.icpScore > 75 ? 'likely' : 'unverified',
      strengths: data.tags,
      researched_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString()
    }

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('connection_intelligence_profiles')
        .update({
          ...profileData,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        
      if (error) {
        console.error('Failed to update intelligence profile:', error)
      } else {
        console.log('✅ Intelligence profile updated')
      }
    } else {
      // Create new profile
      const { error } = await supabase
        .from('connection_intelligence_profiles')
        .insert(profileData)
        
      if (error) {
        console.error('Failed to create intelligence profile:', error)
      } else {
        console.log('✅ Intelligence profile created')
      }
    }
  } catch (error) {
    console.error('Error managing intelligence profile:', error)
    // Don't fail the main operation if intelligence profile fails
  }
}

// GET endpoint to retrieve connections
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let query = supabase
      .from('linkedin_connections')
      .select(`
        id,
        full_name,
        username,
        title,
        current_company,
        headline,
        profile_picture_url,
        last_synced_at,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,current_company.ilike.%${search}%,title.ilike.%${search}%`)
    }

    const { data: connections, error, count } = await query

    if (error) {
      console.error('Error fetching connections:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch connections',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: connections || [],
      pagination: {
        limit,
        offset,
        total: count || connections?.length || 0
      },
      meta: {
        search,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error in GET connections:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}