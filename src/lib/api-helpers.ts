import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateInput, formatValidationErrors, sanitizeString } from './validation'

// ===================================================
// API HELPER FUNCTIONS
// ===================================================

// Get client IP address from request
export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const xClientIP = request.headers.get('x-client-ip')
  
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP.trim()
  }
  
  if (xClientIP) {
    return xClientIP.trim()
  }
  
  // Fallback to connection remote address
  return 'unknown'
}

// Get user agent from request
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

// Validate JSON request body
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    
    const validationResult = validateInput(schema, body)
    if (!validationResult.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: formatValidationErrors(validationResult.errors!)
          },
          { status: 400 }
        )
      }
    }
    
    return {
      success: true,
      data: validationResult.data!
    }
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid JSON format',
          details: { body: ['Request body must be valid JSON'] }
        },
        { status: 400 }
      )
    }
  }
}

// Validate query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  const params: Record<string, string> = {}
  
  // Convert URLSearchParams to object
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }
  
  const validationResult = validateInput(schema, params)
  if (!validationResult.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: formatValidationErrors(validationResult.errors!)
        },
        { status: 400 }
      )
    }
  }
  
  return {
    success: true,
    data: validationResult.data!
  }
}

// Create success response
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  metadata?: Record<string, any>
): NextResponse {
  return NextResponse.json({
    success: true,
    message: message || 'Operation completed successfully',
    data,
    ...(metadata && { metadata })
  })
}

// Create error response
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details })
    },
    { status }
  )
}

// Create validation error response
export function createValidationErrorResponse(
  errors: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors
    },
    { status: 400 }
  )
}

// Sanitize object with string values
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj } as any
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    }
  }
  
  return sanitized
}

// Handle method validation
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { 
        error: 'Method not allowed',
        allowed: allowedMethods
      },
      { 
        status: 405,
        headers: {
          'Allow': allowedMethods.join(', ')
        }
      }
    )
  }
  return null
}

// Parse pagination parameters
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const offset = (page - 1) * limit
  
  return {
    page,
    limit,
    offset
  }
}

// Parse search parameters
export function parseSearch(searchParams: URLSearchParams): string | null {
  const search = searchParams.get('search')
  if (!search || search.trim().length === 0) {
    return null
  }
  
  return sanitizeString(search.trim())
}

// Create pagination metadata
export function createPaginationMetadata(
  page: number,
  limit: number,
  totalItems: number,
  hasMore: boolean = false
) {
  const totalPages = Math.ceil(totalItems / limit)
  
  return {
    pagination: {
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages,
      has_previous: page > 1,
      has_next: page < totalPages || hasMore,
      has_more: hasMore
    }
  }
}

// Rate limiting key generators
export const rateLimitKeyGenerators = {
  byIP: (request: NextRequest) => `ip_${getClientIP(request)}`,
  byEndpoint: (request: NextRequest) => `endpoint_${request.nextUrl.pathname}`,
  byIPAndEndpoint: (request: NextRequest) => `ip_endpoint_${getClientIP(request)}_${request.nextUrl.pathname}`,
  byUserAgent: (request: NextRequest) => `ua_${getUserAgent(request).slice(0, 50)}`,
}

// Common HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// Request size limits (in bytes)
export const REQUEST_LIMITS = {
  SMALL: 1024,      // 1KB - for small JSON requests
  MEDIUM: 10240,    // 10KB - for medium JSON requests
  LARGE: 102400,    // 100KB - for large JSON requests
  UPLOAD: 5242880,  // 5MB - for file uploads
} as const

// Validate request size
export function validateRequestSize(
  request: NextRequest,
  maxSize: number
): NextResponse | null {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > maxSize) {
      return createErrorResponse(
        'Request too large',
        413,
        { max_size: maxSize, received_size: size }
      )
    }
  }
  
  return null
}

// Security headers
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const

// Add security headers to response
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    response.headers.set(header, value)
  })
  
  return response
}

// CORS configuration
export function configureCORS(
  response: NextResponse,
  options: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  } = {}
): NextResponse {
  const {
    origin = process.env.NODE_ENV === 'development' ? '*' : 'https://yourdomain.com',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = true
  } = options
  
  if (Array.isArray(origin)) {
    // Handle multiple origins (in a real implementation, you'd check the request origin)
    response.headers.set('Access-Control-Allow-Origin', origin[0])
  } else {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '))
  
  if (credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}