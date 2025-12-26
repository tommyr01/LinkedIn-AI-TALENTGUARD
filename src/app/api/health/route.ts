import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: ServiceStatus
    redis: ServiceStatus
    external_apis: ServiceStatus
  }
  version: string
  uptime: number
  environment: string
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy'
  response_time?: number
  error?: string
  last_check: string
}

// GET - Health check endpoint
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp,
    services: {
      database: { status: 'healthy', last_check: timestamp },
      redis: { status: 'healthy', last_check: timestamp },
      external_apis: { status: 'healthy', last_check: timestamp }
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }

  // Check database connection
  try {
    const dbStartTime = Date.now()
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('linkedin_connections')
      .select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      throw error
    }
    
    healthStatus.services.database = {
      status: 'healthy',
      response_time: Date.now() - dbStartTime,
      last_check: timestamp
    }
  } catch (error: any) {
    healthStatus.services.database = {
      status: 'unhealthy',
      error: error.message,
      last_check: timestamp
    }
    healthStatus.status = 'degraded'
  }

  // Check Redis connection
  try {
    const redisStartTime = Date.now()
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    
    await redis.ping()
    await redis.disconnect()
    
    healthStatus.services.redis = {
      status: 'healthy',
      response_time: Date.now() - redisStartTime,
      last_check: timestamp
    }
  } catch (error: any) {
    healthStatus.services.redis = {
      status: 'unhealthy',
      error: error.message,
      last_check: timestamp
    }
    healthStatus.status = 'degraded'
  }

  // Check external APIs (basic connectivity)
  try {
    const apiStartTime = Date.now()
    
    // Test OpenAI API availability (without making actual request)
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }
    
    // Test Perplexity API availability
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured')
    }
    
    // Test RapidAPI key
    if (!process.env.RAPIDAPI_KEY) {
      throw new Error('RapidAPI key not configured')
    }
    
    healthStatus.services.external_apis = {
      status: 'healthy',
      response_time: Date.now() - apiStartTime,
      last_check: timestamp
    }
  } catch (error: any) {
    healthStatus.services.external_apis = {
      status: 'unhealthy',
      error: error.message,
      last_check: timestamp
    }
    healthStatus.status = 'degraded'
  }

  // Determine overall status
  const unhealthyServices = Object.values(healthStatus.services)
    .filter(service => service.status === 'unhealthy')
  
  if (unhealthyServices.length > 1) {
    healthStatus.status = 'unhealthy'
  } else if (unhealthyServices.length === 1) {
    healthStatus.status = 'degraded'
  }

  // Set appropriate HTTP status code
  const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 200 : 503

  return NextResponse.json(healthStatus, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  })
}