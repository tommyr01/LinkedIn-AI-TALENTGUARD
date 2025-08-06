import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing LinkedIn API configuration')
    
    // Check environment variables
    const hasRapidApiKey = !!process.env.RAPIDAPI_KEY
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:', {
      hasRapidApiKey,
      hasSupabaseUrl,
      hasSupabaseKey,
      rapidApiKeyPrefix: process.env.RAPIDAPI_KEY?.substring(0, 10)
    })

    // Test simple RapidAPI call
    const testUsername = 'jameserichardson'
    const url = `https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/profile/detail?username=${testUsername}`
    
    console.log(`Testing API call to: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com'
      }
    })

    const responseInfo = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    }

    console.log('API Response Info:', responseInfo)

    let responseData = null
    let responseText = ''

    try {
      responseText = await response.text()
      responseData = JSON.parse(responseText)
    } catch (e) {
      // Response is not JSON
      responseData = { error: 'Non-JSON response', text: responseText.substring(0, 500) }
    }

    return NextResponse.json({
      success: response.ok,
      environment: {
        hasRapidApiKey,
        hasSupabaseUrl,
        hasSupabaseKey,
        rapidApiKeyLength: process.env.RAPIDAPI_KEY?.length,
        nodeEnv: process.env.NODE_ENV
      },
      apiTest: {
        url,
        testUsername,
        response: responseInfo,
        data: responseData
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Test API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      environment: {
        hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
        rapidApiKeyLength: process.env.RAPIDAPI_KEY?.length
      }
    }, { status: 500 })
  }
}