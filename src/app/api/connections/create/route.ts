import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { name, linkedinUrl } = await request.json()

    if (!name || !linkedinUrl) {
      return NextResponse.json({ 
        error: 'Name and LinkedIn URL are required' 
      }, { status: 400 })
    }

    // Extract username from LinkedIn URL
    const username = extractUsernameFromUrl(linkedinUrl)
    if (!username) {
      return NextResponse.json({ 
        error: 'Invalid LinkedIn URL format' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const connectionData = {
      full_name: name,
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' '),
      username: username,
      headline: '', // Manual entry won't have this initially
      profile_picture_url: '',
      about: '',
      full_location: '',
      is_creator: false,
      is_influencer: false,
      is_premium: false,
      follower_count: 0,
      connection_count: 0,
      current_company: '',
      title: '',
      last_synced_at: new Date().toISOString()
    }

    const { data: connection, error } = await supabase
      .from('linkedin_connections')
      .insert(connectionData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to create connection',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      connection,
      message: 'Connection created successfully'
    })

  } catch (error: any) {
    console.error('Error creating connection:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

function extractUsernameFromUrl(url: string): string | null {
  try {
    // Handle various LinkedIn URL formats
    const patterns = [
      /linkedin\.com\/in\/([^\/\?]+)/i,
      /linkedin\.com\/profile\/view\?id=([^&]+)/i
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    return null
  }
}