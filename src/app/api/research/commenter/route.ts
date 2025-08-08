import { NextRequest, NextResponse } from 'next/server'
import { linkedInScraper, extractUsernameFromLinkedInUrl } from '../../../../lib/linkedin-scraper'
import { icpScorer, ProspectProfile } from '../../../../lib/icp-scorer'
import { researchedProspectsOperations } from '../../../../lib/airtable'
import { validateInput, commenterResearchSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Researching LinkedIn commenter...')

    // Check required environment variables
    if (!process.env.RAPIDAPI_KEY) {
      return NextResponse.json({ 
        error: 'Missing required RapidAPI configuration' 
      }, { status: 500 })
    }

    // Validate request body
    const body = await request.json()
    const validationResult = validateInput(commenterResearchSchema, body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.errors?.issues.map(issue => issue.message).join(', ')
      }, { status: 400 })
    }

    const { profileUrl, name, headline, forceRefresh } = validationResult.data!

    console.log(`📡 Researching profile: ${profileUrl}`)

    // Extract username from LinkedIn URL
    const username = extractUsernameFromLinkedInUrl(profileUrl)
    if (!username) {
      return NextResponse.json({ 
        error: 'Invalid LinkedIn profile URL' 
      }, { status: 400 })
    }

    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      console.log('🔍 Checking cache for existing research...')
      const cachedResult = await researchedProspectsOperations.findByProfileUrl(profileUrl)
      
      if (cachedResult.success && cachedResult.data) {
        // Check if cache is not too old (e.g., less than 7 days)
        const cacheAge = new Date().getTime() - new Date(cachedResult.data['Updated At']).getTime()
        const maxCacheAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        
        if (cacheAge < maxCacheAge) {
          console.log('✅ Found cached research result')
          
          // Convert cached data back to ProspectProfile format
          const cachedProspectProfile: ProspectProfile = {
            name: cachedResult.data['Name'] as string,
            role: cachedResult.data['Role'] as string || '',
            company: cachedResult.data['Company'] as string || '',
            location: cachedResult.data['Location'] as string || '',
            headline: cachedResult.data['Headline'] as string || '',
            profileUrl: cachedResult.data['Profile URL'] as string,
            icpScore: {
              totalScore: cachedResult.data['ICP Score'] as number,
              category: cachedResult.data['ICP Category'] as string,
              tags: cachedResult.data.icpTags || []
            }
          }
          
          return NextResponse.json({
            success: true,
            prospect: cachedProspectProfile,
            meta: {
              researchedAt: cachedResult.data['Updated At'],
              source: cachedResult.data['Research Source'] || 'linkedin-comment',
              cached: true,
              cacheAge: Math.round(cacheAge / (1000 * 60 * 60)) // hours
            }
          })
        } else {
          console.log('⏰ Cached data is too old, fetching fresh data')
        }
      }
    }

    // Fetch fresh LinkedIn profile data
    console.log('🌐 Fetching fresh data from LinkedIn API...')
    const profileData = await linkedInScraper.getProfile(username)
    
    if (!profileData.success) {
      throw new Error(profileData.message || 'Failed to fetch LinkedIn profile')
    }

    // Score the profile using ICP criteria
    const prospectProfile: ProspectProfile = icpScorer.createProspectProfile(profileData, profileUrl)
    
    console.log(`✅ Research completed for ${prospectProfile.name}`)
    console.log(`📊 ICP Score: ${prospectProfile.icpScore.totalScore} (${prospectProfile.icpScore.category})`)

    // Cache the result in Airtable "Researched Prospects" table
    try {
      console.log('💾 Caching research result...')
      await researchedProspectsOperations.create({
        name: prospectProfile.name,
        profileUrl: prospectProfile.profileUrl,
        role: prospectProfile.role,
        company: prospectProfile.company,
        location: prospectProfile.location,
        headline: prospectProfile.headline,
        icpScore: prospectProfile.icpScore.totalScore,
        icpCategory: prospectProfile.icpScore.category,
        icpTags: prospectProfile.icpScore.tags,
        researchData: profileData.data,
        researchSource: 'linkedin-comment'
      })
      console.log('✅ Research result cached successfully')
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache research result:', cacheError)
      // Don't fail the request if caching fails
    }

    return NextResponse.json({
      success: true,
      prospect: prospectProfile,
      meta: {
        researchedAt: new Date().toISOString(),
        source: 'linkedin-comment',
        cached: false
      }
    })

  } catch (error: any) {
    console.error('Error researching commenter:', error)
    
    // Handle specific LinkedIn API errors
    if (error.message?.includes('LinkedIn API error')) {
      return NextResponse.json({ 
        error: 'Failed to fetch LinkedIn profile data',
        details: error.message
      }, { status: 502 })
    }

    // Handle rate limiting
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'LinkedIn API rate limit exceeded. Please try again later.',
        details: error.message
      }, { status: 429 })
    }

    return NextResponse.json({ 
      error: 'Failed to research commenter',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Handle GET requests for cached research results
    const searchParams = request.nextUrl.searchParams
    const profileUrl = searchParams.get('profileUrl')

    if (!profileUrl) {
      return NextResponse.json({ 
        error: 'Missing required profileUrl parameter' 
      }, { status: 400 })
    }

    // Validate the profile URL
    const validationResult = validateInput(commenterResearchSchema.pick({ profileUrl: true }), { profileUrl })
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid LinkedIn profile URL format',
        details: validationResult.errors?.issues.map(issue => issue.message).join(', ')
      }, { status: 400 })
    }

    console.log(`🔍 Checking cache for profile: ${profileUrl}`)

    // Check cache in Airtable for existing research
    const cachedResult = await researchedProspectsOperations.findByProfileUrl(profileUrl)
    
    if (cachedResult.success && cachedResult.data) {
      // Check if cache is still valid (less than 7 days old)
      const cacheAge = new Date().getTime() - new Date(cachedResult.data['Updated At']).getTime()
      const maxCacheAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      
      if (cacheAge < maxCacheAge) {
        console.log('✅ Found valid cached research result')
        
        // Convert cached data back to ProspectProfile format
        const cachedProspectProfile: ProspectProfile = {
          name: cachedResult.data['Name'] as string,
          role: cachedResult.data['Role'] as string || '',
          company: cachedResult.data['Company'] as string || '',
          location: cachedResult.data['Location'] as string || '',
          headline: cachedResult.data['Headline'] as string || '',
          profileUrl: cachedResult.data['Profile URL'] as string,
          icpScore: {
            totalScore: cachedResult.data['ICP Score'] as number,
            category: cachedResult.data['ICP Category'] as string,
            tags: cachedResult.data.icpTags || []
          }
        }
        
        return NextResponse.json({
          success: true,
          prospect: cachedProspectProfile,
          meta: {
            researchedAt: cachedResult.data['Updated At'],
            source: cachedResult.data['Research Source'] || 'linkedin-comment',
            cached: true,
            cacheAge: Math.round(cacheAge / (1000 * 60 * 60)) // hours
          }
        })
      } else {
        console.log('⏰ Cached data is too old')
        return NextResponse.json({
          success: false,
          cached: false,
          message: 'Cached research data is too old',
          cacheAge: Math.round(cacheAge / (1000 * 60 * 60)) // hours
        }, { status: 404 })
      }
    }

    // No cached research found
    console.log('❌ No cached research found')
    return NextResponse.json({
      success: false,
      cached: false,
      message: 'No cached research found'
    }, { status: 404 })

  } catch (error: any) {
    console.error('Error fetching cached research:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch cached research',
      details: error.message
    }, { status: 500 })
  }
}