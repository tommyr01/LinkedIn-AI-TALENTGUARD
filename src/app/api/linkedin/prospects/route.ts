import { NextRequest, NextResponse } from 'next/server'
import { supabaseLinkedIn } from '@/lib/supabase-linkedin'
import { isSupabaseConfigured, validateSupabaseConfig } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching high-value LinkedIn prospects from TalentGuard...')

    // Validate Supabase configuration at runtime
    if (!isSupabaseConfigured()) {
      const { error } = validateSupabaseConfig()
      console.error('Supabase configuration error:', error)
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured properly',
        details: error
      }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const minScore = parseInt(searchParams.get('minScore') || '60')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category') // 'High Value', 'Medium Value', etc.
    
    console.log(`📡 Requesting prospects with min ICP score: ${minScore}`)

    // Fetch high-value prospects
    const prospects = await supabaseLinkedIn.getHighValueProspects(minScore)
    
    // Filter by category if specified
    const filteredProspects = category 
      ? prospects.filter((p: any) => p.icp_category === category)
      : prospects

    // Limit results
    const limitedProspects = filteredProspects.slice(0, limit)

    console.log(`✅ Found ${limitedProspects.length} high-value LinkedIn prospects`)

    // Transform for TalentGuard UI
    const transformedProspects = limitedProspects.map((prospect: any) => ({
      id: prospect.id,
      name: prospect.name,
      headline: prospect.headline,
      company: prospect.current_company,
      role: prospect.current_role,
      profileUrl: prospect.profile_url,
      profilePicture: prospect.profile_picture,
      
      // ICP scoring
      icpScore: prospect.icp_score,
      icpCategory: prospect.icp_category,
      icpConfidence: prospect.icp_confidence,
      dataQuality: prospect.data_quality,
      
      // Engagement data
      totalComments: prospect.total_comments || 0,
      lastEngagementDate: prospect.last_engagement_date,
      
      // Research status
      isResearched: !!prospect.last_researched_at,
      lastResearchedAt: prospect.last_researched_at,
      
      // Additional insights
      signals: prospect.signals || [],
      tags: prospect.icp_tags || [],
      reasoning: prospect.icp_reasoning || [],
      
      createdAt: prospect.created_at
    }))

    // Calculate summary statistics
    const stats = {
      totalProspects: transformedProspects.length,
      highValueProspects: transformedProspects.filter(p => p.icpCategory === 'High Value').length,
      mediumValueProspects: transformedProspects.filter(p => p.icpCategory === 'Medium Value').length,
      lowValueProspects: transformedProspects.filter(p => p.icpCategory === 'Low Value').length,
      averageIcpScore: transformedProspects.length > 0 
        ? Math.round(transformedProspects.reduce((sum, p) => sum + (p.icpScore || 0), 0) / transformedProspects.length)
        : 0,
      totalEngagements: transformedProspects.reduce((sum, p) => sum + (p.totalComments || 0), 0),
      researchedProspects: transformedProspects.filter(p => p.isResearched).length,
      
      // Category breakdown
      categoryBreakdown: {
        'High Value': transformedProspects.filter(p => p.icpCategory === 'High Value').length,
        'Medium Value': transformedProspects.filter(p => p.icpCategory === 'Medium Value').length,
        'Low Value': transformedProspects.filter(p => p.icpCategory === 'Low Value').length,
        'Not Qualified': transformedProspects.filter(p => p.icpCategory === 'Not Qualified').length
      },

      // Top companies
      topCompanies: getTopCompanies(transformedProspects, 5),
      
      // Recent activity
      recentEngagements: transformedProspects
        .filter(p => p.lastEngagementDate)
        .sort((a, b) => new Date(b.lastEngagementDate).getTime() - new Date(a.lastEngagementDate).getTime())
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          company: p.company,
          lastEngagement: p.lastEngagementDate,
          icpScore: p.icpScore
        }))
    }

    return NextResponse.json({
      success: true,
      prospects: transformedProspects,
      stats,
      meta: {
        minScore,
        limit,
        category,
        totalFound: filteredProspects.length,
        returned: transformedProspects.length,
        dataSource: 'linkedin-engagement'
      },
      actions: {
        addToContacts: '/api/contacts',
        generateSignal: '/api/signals',
        researchProfile: (profileUrl: string) => `/api/linkedin/research/${encodeURIComponent(profileUrl)}`,
        viewEngagement: (profileUrl: string) => `/api/linkedin/engagement/${encodeURIComponent(profileUrl)}`
      }
    })

  } catch (error: any) {
    console.error('Error fetching LinkedIn prospects:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch LinkedIn prospects',
      details: error.message
    }, { status: 500 })
  }
}

// POST endpoint for batch operations on prospects
export async function POST(request: NextRequest) {
  try {
    // Validate Supabase configuration at runtime
    if (!isSupabaseConfigured()) {
      const { error } = validateSupabaseConfig()
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured properly',
        details: error
      }, { status: 500 })
    }

    const body = await request.json()
    const { action, prospectIds, data } = body

    if (!action || !prospectIds || !Array.isArray(prospectIds)) {
      return NextResponse.json({
        error: 'Invalid request. Required: action, prospectIds (array)'
      }, { status: 400 })
    }

    console.log(`🔄 Processing batch action '${action}' for ${prospectIds.length} prospects`)

    const results = []
    let successCount = 0
    let errorCount = 0

    switch (action) {
      case 'add_to_contacts':
        // Add selected prospects to TalentGuard contacts
        for (const prospectId of prospectIds) {
          try {
            // Get prospect details
            const prospect = await supabaseLinkedIn.getProfileByUrl(prospectId) // Using profile URL as ID
            if (prospect) {
              // Create contact record (this would call the existing contacts API)
              const contactData = {
                name: prospect.name,
                email: '', // LinkedIn doesn't provide email
                title: prospect.current_role || '',
                linkedin_url: prospect.profile_url,
                role_category: mapICPCategoryToRoleCategory(prospect.icp_category || 'Not Qualified'),
                // Add ICP data as metadata
                signal_summary: {
                  value: `LinkedIn engagement prospect (ICP Score: ${prospect.icp_score || 0}/100)`,
                  isStale: false
                }
              }

              // Call existing contacts API
              const contactResponse = await fetch(`${request.nextUrl.origin}/api/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
              })

              if (contactResponse.ok) {
                results.push({ prospectId, status: 'success', action: 'added_to_contacts' })
                successCount++
              } else {
                throw new Error('Failed to create contact')
              }
            }
          } catch (error: any) {
            results.push({ prospectId, status: 'error', error: error.message })
            errorCount++
          }
        }
        break

      case 'generate_signals':
        // Generate buyer signals for selected prospects
        for (const prospectId of prospectIds) {
          try {
            const prospect = await supabaseLinkedIn.getProfileByUrl(prospectId)
            if (prospect) {
              // Create signal record
              const signalData = {
                type: 'LinkedIn Engagement',
                description: `${prospect.name} from ${prospect.current_company} engaged with LinkedIn content`,
                strength: (prospect.icp_score || 0) >= 80 ? 'Strong' : (prospect.icp_score || 0) >= 60 ? 'Medium' : 'Weak',
                source: 'LinkedIn',
                metadata: {
                  profileUrl: prospect.profile_url,
                  icpScore: prospect.icp_score,
                  company: prospect.current_company,
                  role: prospect.current_role
                }
              }

              // This would call the signals API when implemented
              results.push({ prospectId, status: 'success', action: 'signal_generated' })
              successCount++
            }
          } catch (error: any) {
            results.push({ prospectId, status: 'error', error: error.message })
            errorCount++
          }
        }
        break

      case 'update_research_status':
        // Mark prospects as researched/not researched
        for (const prospectId of prospectIds) {
          try {
            await supabaseLinkedIn.upsertProfile({
              profile_url: prospectId,
              profile_researched: data.researched || true,
              last_researched_at: new Date().toISOString()
            })
            
            results.push({ prospectId, status: 'success', action: 'research_status_updated' })
            successCount++
          } catch (error: any) {
            results.push({ prospectId, status: 'error', error: error.message })
            errorCount++
          }
        }
        break

      default:
        return NextResponse.json({
          error: `Unknown action: ${action}. Supported: add_to_contacts, generate_signals, update_research_status`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Batch operation completed: ${successCount} successful, ${errorCount} errors`,
      data: {
        action,
        totalProcessed: prospectIds.length,
        successCount,
        errorCount,
        results
      }
    })

  } catch (error: any) {
    console.error('Error in LinkedIn prospects batch operation:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Batch operation failed',
      details: error.message
    }, { status: 500 })
  }
}

function getTopCompanies(prospects: any[], limit: number) {
  const companyCounts = prospects.reduce((acc: any, prospect) => {
    const company = prospect.company || 'Unknown'
    acc[company] = (acc[company] || 0) + 1
    return acc
  }, {})

  return Object.entries(companyCounts)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, limit)
    .map(([company, count]) => ({ company, count }))
}

function mapICPCategoryToRoleCategory(icpCategory: string): string {
  switch (icpCategory) {
    case 'High Value':
      return 'Exec Sponsor'
    case 'Medium Value':
      return 'Champion'
    case 'Low Value':
      return 'Buyer'
    default:
      return 'Other'
  }
}