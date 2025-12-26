import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET - Prometheus metrics endpoint
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Collect application metrics
    const metrics = []
    
    // Node.js process metrics
    const memUsage = process.memoryUsage()
    metrics.push(`# HELP nodejs_memory_usage_bytes Memory usage in bytes`)
    metrics.push(`# TYPE nodejs_memory_usage_bytes gauge`)
    metrics.push(`nodejs_memory_usage_bytes{type="rss"} ${memUsage.rss}`)
    metrics.push(`nodejs_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`)
    metrics.push(`nodejs_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`)
    metrics.push(`nodejs_memory_usage_bytes{type="external"} ${memUsage.external}`)
    
    // Process uptime
    metrics.push(`# HELP nodejs_process_uptime_seconds Process uptime in seconds`)
    metrics.push(`# TYPE nodejs_process_uptime_seconds counter`)
    metrics.push(`nodejs_process_uptime_seconds ${process.uptime()}`)
    
    // Database metrics
    try {
      // Total connections count
      const { data: connectionsData } = await supabase
        .from('linkedin_connections')
        .select('count(*)', { count: 'exact', head: true })
      
      if (connectionsData) {
        metrics.push(`# HELP talentguard_total_connections Total LinkedIn connections`)
        metrics.push(`# TYPE talentguard_total_connections gauge`)
        metrics.push(`talentguard_total_connections ${connectionsData.length || 0}`)
      }
      
      // Active tone profiles count
      const { data: profilesData } = await supabase
        .from('tone_profiles')
        .select('count(*)', { count: 'exact', head: true })
        .eq('is_active', true)
      
      if (profilesData) {
        metrics.push(`# HELP talentguard_active_tone_profiles Active tone profiles`)
        metrics.push(`# TYPE talentguard_active_tone_profiles gauge`)
        metrics.push(`talentguard_active_tone_profiles ${profilesData.length || 0}`)
      }
      
      // Recent research count (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { data: recentResearch } = await supabase
        .from('web_research_results')
        .select('count(*)', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
      
      if (recentResearch) {
        metrics.push(`# HELP talentguard_recent_research_requests Research requests in last 24h`)
        metrics.push(`# TYPE talentguard_recent_research_requests gauge`)
        metrics.push(`talentguard_recent_research_requests ${recentResearch.length || 0}`)
      }
      
      // High value prospects count
      const { data: highValueProspects } = await supabase
        .from('connection_intelligence_profiles')
        .select('count(*)', { count: 'exact', head: true })
        .gt('confidence_level', 70)
      
      if (highValueProspects) {
        metrics.push(`# HELP talentguard_high_value_prospects High value prospects (>70% confidence)`)
        metrics.push(`# TYPE talentguard_high_value_prospects gauge`)
        metrics.push(`talentguard_high_value_prospects ${highValueProspects.length || 0}`)
      }
      
    } catch (dbError) {
      console.error('Error collecting database metrics:', dbError)
      metrics.push(`# Database metrics collection failed`)
    }
    
    // API usage metrics (if available)
    try {
      // LinkedIn API quota (mock - would need real implementation)
      metrics.push(`# HELP talentguard_linkedin_api_quota_remaining LinkedIn API quota remaining`)
      metrics.push(`# TYPE talentguard_linkedin_api_quota_remaining gauge`)
      metrics.push(`talentguard_linkedin_api_quota_remaining 5000`) // Mock value
      
      // OpenAI API usage (mock - would need real tracking)
      metrics.push(`# HELP talentguard_openai_requests_total OpenAI API requests total`)
      metrics.push(`# TYPE talentguard_openai_requests_total counter`)
      metrics.push(`talentguard_openai_requests_total 1234`) // Mock value
      
    } catch (apiError) {
      console.error('Error collecting API metrics:', apiError)
      metrics.push(`# API metrics collection failed`)
    }
    
    // Application-specific metrics
    const timestamp = Date.now()
    metrics.push(`# HELP talentguard_last_metrics_collection_timestamp Last metrics collection timestamp`)
    metrics.push(`# TYPE talentguard_last_metrics_collection_timestamp gauge`)
    metrics.push(`talentguard_last_metrics_collection_timestamp ${timestamp}`)
    
    // Custom business metrics
    metrics.push(`# HELP talentguard_build_info Build information`)
    metrics.push(`# TYPE talentguard_build_info gauge`)
    metrics.push(`talentguard_build_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1`)
    
    const metricsText = metrics.join('\n') + '\n'
    
    return new NextResponse(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error: any) {
    console.error('Error generating metrics:', error)
    
    const errorMetrics = [
      `# HELP talentguard_metrics_error Metrics collection error`,
      `# TYPE talentguard_metrics_error gauge`,
      `talentguard_metrics_error 1`,
      `# Error: ${error.message}`
    ].join('\n') + '\n'
    
    return new NextResponse(errorMetrics, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  }
}