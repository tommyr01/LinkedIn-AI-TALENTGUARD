import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { username, createRecord } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Get LinkedIn profile data via RapidAPI
    const linkedinData = await fetchLinkedInProfile(username)
    
    if (!linkedinData) {
      return NextResponse.json({ 
        error: 'Failed to fetch LinkedIn profile data' 
      }, { status: 404 })
    }

    // If createRecord is false, just return the data
    if (!createRecord) {
      return NextResponse.json({ 
        success: true, 
        linkedinData 
      })
    }

    // Create Supabase record
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const connectionData = {
      full_name: linkedinData.fullname,
      first_name: linkedinData.fullname.split(' ')[0],
      last_name: linkedinData.fullname.split(' ').slice(1).join(' '),
      headline: linkedinData.headline,
      username: username,
      profile_picture_url: linkedinData.profile_picture_url,
      about: linkedinData.about,
      full_location: linkedinData.location?.full,
      is_creator: linkedinData.is_creator,
      is_influencer: linkedinData.is_influencer,
      is_premium: linkedinData.is_premium,
      follower_count: linkedinData.follower_count,
      connection_count: linkedinData.connection_count,
      current_company: linkedinData.current_company,
      title: linkedinData.headline,
      last_synced_at: new Date().toISOString()
    }

    const { data: supabaseRecord, error } = await supabase
      .from('linkedin_connections')
      .upsert(connectionData, { onConflict: 'username' })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to save connection to database',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      linkedinData,
      supabaseRecord,
      message: 'Connection created successfully'
    })

  } catch (error: any) {
    console.error('Error in connection sync:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

async function fetchLinkedInProfile(username: string) {
  try {
    const url = `https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/profile/detail?username=${username}`
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com'
      }
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform the response to match expected format
    const transformedData = {
      fullname: data.full_name || data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      headline: data.headline || data.description || '',
      about: data.about || data.summary || '',
      location: {
        full: data.location || data.full_location || ''
      },
      follower_count: data.follower_count || data.followers_count || 0,
      connection_count: data.connection_count || data.connections_count || 0,
      current_company: data.current_company || data.company || '',
      profile_picture_url: data.profile_picture_url || data.profile_picture || data.avatar_url || '',
      is_creator: data.is_creator || false,
      is_influencer: data.is_influencer || false,
      is_premium: data.is_premium || false
    }
    
    if (!transformedData.fullname) {
      throw new Error('Invalid LinkedIn profile data received - no name found')
    }

    return transformedData

  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error)
    return null
  }
}