import { NextRequest, NextResponse } from 'next/server'
import { validateSession, logAuditEvent, type User } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user: User
  sessionId: string
}

export interface AuthMiddlewareOptions {
  allowedRoles?: ('admin' | 'user' | 'viewer')[]
  requireAuth?: boolean
  logAccess?: boolean
}

// Extract token from request headers
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check for token in cookies
  const token = request.cookies.get('auth-token')?.value
  return token || null
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP
  }
  
  return 'unknown'
}

// Authentication middleware for API routes
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  const {
    allowedRoles = ['admin', 'user', 'viewer'],
    requireAuth = true,
    logAccess = true
  } = options

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const endpoint = request.nextUrl.pathname
    
    try {
      // Extract token
      const token = extractToken(request)
      
      if (requireAuth && !token) {
        if (logAccess) {
          await logAuditEvent(
            null,
            'UNAUTHORIZED_ACCESS',
            endpoint,
            ipAddress,
            userAgent,
            false,
            'No authentication token provided'
          )
        }
        
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      let user: User | null = null
      let sessionId: string | null = null
      
      // Validate session if token is provided
      if (token) {
        const sessionData = await validateSession(token)
        
        if (!sessionData && requireAuth) {
          if (logAccess) {
            await logAuditEvent(
              null,
              'INVALID_TOKEN',
              endpoint,
              ipAddress,
              userAgent,
              false,
              'Invalid or expired authentication token'
            )
          }
          
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          )
        }
        
        if (sessionData) {
          user = sessionData.user
          sessionId = sessionData.sessionId
        }
      }
      
      // Check role authorization
      if (requireAuth && user && !allowedRoles.includes(user.role)) {
        if (logAccess) {
          await logAuditEvent(
            user.id,
            'FORBIDDEN_ACCESS',
            endpoint,
            ipAddress,
            userAgent,
            false,
            `User role '${user.role}' not allowed for this endpoint`
          )
        }
        
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      
      // Add user information to request
      const authenticatedRequest = request as AuthenticatedRequest
      if (user && sessionId) {
        authenticatedRequest.user = user
        authenticatedRequest.sessionId = sessionId
      }
      
      // Call the actual handler
      const response = await handler(authenticatedRequest)
      
      // Log successful access
      if (logAccess && user) {
        const responseTime = Date.now() - startTime
        await logAuditEvent(
          user.id,
          'API_ACCESS',
          endpoint,
          ipAddress,
          userAgent,
          true,
          undefined,
          {
            method: request.method,
            response_time_ms: responseTime,
            status_code: response.status
          }
        )
      }
      
      return response
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      
      if (logAccess) {
        await logAuditEvent(
          null,
          'AUTH_MIDDLEWARE_ERROR',
          endpoint,
          ipAddress,
          userAgent,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Role-specific middleware helpers
export const withAdminAuth = (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
  withAuth(handler, { allowedRoles: ['admin'] })

export const withUserAuth = (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
  withAuth(handler, { allowedRoles: ['admin', 'user'] })

export const withViewerAuth = (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
  withAuth(handler, { allowedRoles: ['admin', 'user', 'viewer'] })

// Optional auth middleware (allows both authenticated and unauthenticated access)
export const withOptionalAuth = (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
  withAuth(handler, { requireAuth: false, logAccess: false })

// Rate limiting helper
interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: NextRequest) => string
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions
) {
  const { maxRequests, windowMs, keyGenerator } = options
  
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const key = keyGenerator ? keyGenerator(request) : getClientIP(request)
      const endpoint = request.nextUrl.pathname
      
      // Check current rate limit
      const { supabase } = await import('./supabase')
      const windowStart = new Date(Date.now() - windowMs)
      
      const { data: rateLimitData } = await supabase
        .from('rate_limits')
        .select('requests_count')
        .eq('identifier', key)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .order('window_start', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (rateLimitData && rateLimitData.requests_count >= maxRequests) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(windowMs / 1000)
          },
          { status: 429 }
        )
      }
      
      // Update rate limit counter
      if (rateLimitData) {
        await supabase
          .from('rate_limits')
          .update({ requests_count: rateLimitData.requests_count + 1 })
          .eq('identifier', key)
          .eq('endpoint', endpoint)
          .gte('window_start', windowStart.toISOString())
      } else {
        await supabase
          .from('rate_limits')
          .insert({
            identifier: key,
            endpoint: endpoint,
            requests_count: 1,
            window_start: new Date().toISOString()
          })
      }
      
      // Clean up old rate limit records (optional, could be done with a background job)
      await supabase
        .from('rate_limits')
        .delete()
        .lt('window_start', new Date(Date.now() - windowMs * 2).toISOString())
      
      return handler(request)
      
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // Continue with request if rate limiting fails
      return handler(request)
    }
  }
}

// Combined auth and rate limiting middleware
export function withAuthAndRateLimit(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  authOptions: AuthMiddlewareOptions = {},
  rateLimitOptions: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
) {
  const rateLimitedHandler = withRateLimit(
    (request: NextRequest) => {
      const authHandler = withAuth(handler, authOptions)
      return authHandler(request)
    },
    rateLimitOptions
  )
  
  return rateLimitedHandler
}