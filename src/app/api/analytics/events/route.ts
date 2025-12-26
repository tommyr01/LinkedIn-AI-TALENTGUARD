import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface AnalyticsEvent {
  event_name: string
  user_id?: string
  session_id?: string
  properties?: Record<string, any>
  timestamp?: string
  page_url?: string
  user_agent?: string
  ip_address?: string
}

interface EventValidation {
  isValid: boolean
  errors: string[]
}

// Validate analytics event
function validateEvent(event: AnalyticsEvent): EventValidation {
  const errors: string[] = []
  
  if (!event.event_name || typeof event.event_name !== 'string') {
    errors.push('event_name is required and must be a string')
  }
  
  if (event.event_name && event.event_name.length > 100) {
    errors.push('event_name must be 100 characters or less')
  }
  
  if (event.user_id && typeof event.user_id !== 'string') {
    errors.push('user_id must be a string')
  }
  
  if (event.session_id && typeof event.session_id !== 'string') {
    errors.push('session_id must be a string')
  }
  
  if (event.properties && typeof event.properties !== 'object') {
    errors.push('properties must be an object')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// POST - Track analytics event
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Extract request metadata
    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    const referer = request.headers.get('referer') || ''
    
    // Prepare event data
    const event: AnalyticsEvent = {
      event_name: body.event_name,
      user_id: body.user_id,
      session_id: body.session_id,
      properties: body.properties || {},
      timestamp: body.timestamp || new Date().toISOString(),
      page_url: body.page_url || referer,
      user_agent: userAgent,
      ip_address: ipAddress
    }
    
    // Validate event
    const validation = validateEvent(event)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid event data',
        validation_errors: validation.errors
      }, { status: 400 })
    }
    
    // Store event in database
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event.event_name,
        user_id: event.user_id,
        session_id: event.session_id,
        properties: event.properties,
        page_url: event.page_url,
        user_agent: event.user_agent,
        ip_address: event.ip_address,
        created_at: event.timestamp
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error storing analytics event:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to store event',
        details: error.message
      }, { status: 500 })
    }
    
    // Optional: Forward to external analytics services
    const promises = []
    
    // Google Analytics 4 (if configured)
    if (process.env.GOOGLE_ANALYTICS_ID) {
      promises.push(forwardToGoogleAnalytics(event))
    }
    
    // PostHog (if configured)
    if (process.env.POSTHOG_API_KEY) {
      promises.push(forwardToPostHog(event))
    }
    
    // Mixpanel (if configured)
    if (process.env.MIXPANEL_TOKEN) {
      promises.push(forwardToMixpanel(event))
    }
    
    // Don't wait for external services to complete
    Promise.allSettled(promises).catch(error => {
      console.error('Error forwarding to external analytics:', error)
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        event_name: data.event_name,
        timestamp: data.created_at
      }
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Error in analytics event tracking:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Forward event to Google Analytics 4
async function forwardToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
  try {
    const measurementId = process.env.GOOGLE_ANALYTICS_ID!
    const apiSecret = process.env.GOOGLE_ANALYTICS_API_SECRET
    
    if (!apiSecret) return
    
    const payload = {
      client_id: event.session_id || 'anonymous',
      events: [{
        name: event.event_name.replace(/[^a-zA-Z0-9_]/g, '_'),
        parameters: {
          ...event.properties,
          page_location: event.page_url,
          user_id: event.user_id
        }
      }]
    }
    
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    console.error('Error forwarding to Google Analytics:', error)
  }
}

// Forward event to PostHog
async function forwardToPostHog(event: AnalyticsEvent): Promise<void> {
  try {
    const apiKey = process.env.POSTHOG_API_KEY!
    const endpoint = process.env.POSTHOG_HOST || 'https://app.posthog.com'
    
    const payload = {
      api_key: apiKey,
      event: event.event_name,
      properties: {
        ...event.properties,
        $current_url: event.page_url,
        $ip: event.ip_address,
        $useragent: event.user_agent,
        distinct_id: event.user_id || event.session_id || 'anonymous'
      },
      timestamp: event.timestamp
    }
    
    await fetch(`${endpoint}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    console.error('Error forwarding to PostHog:', error)
  }
}

// Forward event to Mixpanel
async function forwardToMixpanel(event: AnalyticsEvent): Promise<void> {
  try {
    const token = process.env.MIXPANEL_TOKEN!
    
    const payload = {
      event: event.event_name,
      properties: {
        ...event.properties,
        token: token,
        distinct_id: event.user_id || event.session_id || 'anonymous',
        $current_url: event.page_url,
        $ip: event.ip_address,
        $user_agent: event.user_agent,
        time: Math.floor(new Date(event.timestamp!).getTime() / 1000)
      }
    }
    
    const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64')
    
    await fetch('https://api.mixpanel.com/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodedData}`
    })
  } catch (error) {
    console.error('Error forwarding to Mixpanel:', error)
  }
}

// GET - Fetch analytics data (admin only)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Note: In production, you'd want proper admin authentication here
    const supabase = createClient(supabaseUrl, supabaseKey)
    const searchParams = request.nextUrl.searchParams
    
    const limit = Math.min(1000, parseInt(searchParams.get('limit') || '100'))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const event_name = searchParams.get('event_name')
    const user_id = searchParams.get('user_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    
    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (event_name) {
      query = query.eq('event_name', event_name)
    }
    
    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    
    if (date_to) {
      query = query.lte('created_at', date_to)
    }
    
    const { data: events, error } = await query
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch events',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: events || [],
      meta: {
        limit,
        offset,
        filters: {
          event_name,
          user_id,
          date_from,
          date_to
        }
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching analytics events:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}