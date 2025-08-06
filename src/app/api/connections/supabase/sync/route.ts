import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Connection sync API called')
    
    const { username, createRecord } = await request.json()
    console.log(`📝 Request data:`, { username, createRecord })

    if (!username) {
      console.error('❌ Username is required')
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Check if RAPIDAPI_KEY is available
    if (!process.env.RAPIDAPI_KEY) {
      console.error('❌ RAPIDAPI_KEY environment variable not found')
      return NextResponse.json({ 
        error: 'LinkedIn API not configured - missing RAPIDAPI_KEY',
        debug: 'Check Vercel environment variables'
      }, { status: 500 })
    }

    console.log(`📡 Fetching LinkedIn data for username: ${username}`)
    
    // Get LinkedIn profile data via RapidAPI
    const linkedinData = await fetchLinkedInProfile(username)
    
    if (!linkedinData) {
      console.error('❌ Failed to fetch LinkedIn profile data')
      return NextResponse.json({ 
        error: 'Failed to fetch LinkedIn profile data',
        debug: 'Check API logs for details'
      }, { status: 404 })
    }

    console.log('✅ LinkedIn data fetched successfully:', {
      name: linkedinData.fullname,
      company: linkedinData.current_company,
      followers: linkedinData.follower_count
    })

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
    console.log(`🔍 Making LinkedIn API request for: ${username}`)
    
    const url = `https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/profile/detail?username=${username}`
    console.log(`📞 API URL: ${url}`)
    
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com'
      }
    }

    console.log(`🔑 Using API key: ${process.env.RAPIDAPI_KEY?.substring(0, 10)}...`)

    const response = await fetch(url, options)
    
    console.log(`📥 API response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error Response:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`📄 Raw API response:`, JSON.stringify(data, null, 2))
    
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
    
    console.log(`🔄 Transformed data:`, transformedData)
    
    if (!transformedData.fullname) {
      console.error('❌ No name found in transformed data')
      console.log('🐛 Available fields in raw data:', Object.keys(data))
      throw new Error('Invalid LinkedIn profile data received - no name found')
    }

    console.log(`✅ Successfully transformed LinkedIn data for: ${transformedData.fullname}`)
    return transformedData

  } catch (error: any) {
    console.error('💥 Error fetching LinkedIn profile:', {
      username,
      error: error.message,
      stack: error.stack
    })
    return null
  }
}