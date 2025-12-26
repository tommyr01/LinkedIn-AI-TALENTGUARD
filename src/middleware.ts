import { NextRequest, NextResponse } from 'next/server'

// Security headers configuration
const SECURITY_HEADERS = {
  // Prevent the page from being embedded in frames/iframes
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection in browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Restrict dangerous browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.rapidapi.com https://api.openai.com https://api.perplexity.ai wss://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

// CORS configuration
const CORS_ORIGINS = process.env.NODE_ENV === 'development' 
  ? ['http://localhost:3000', 'http://127.0.0.1:3000']
  : [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      // Add your production domains here
    ]

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ].join(', '),
  'Access-Control-Max-Age': '86400', // 24 hours
  'Access-Control-Allow-Credentials': 'true'
}

// Rate limiting configuration (basic in-memory store for demonstration)
const rateLimit = new Map()

function isRateLimited(ip: string, endpoint: string, limit: number, windowMs: number): boolean {
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  
  if (!rateLimit.has(key)) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  const record = rateLimit.get(key)
  
  if (now > record.resetTime) {
    // Reset the window
    record.count = 1
    record.resetTime = now + windowMs
    return false
  }
  
  if (record.count >= limit) {
    return true
  }
  
  record.count++
  return false
}

// Clean up old rate limit records
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimit.entries()) {
    if (now > record.resetTime) {
      rateLimit.delete(key)
    }
  }
}, 60000) // Clean up every minute

// Get client IP address
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP.trim()
  }
  
  return 'unknown'
}

// Check if origin is allowed
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // Allow requests without origin header
  
  if (process.env.NODE_ENV === 'development') {
    return origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
  }
  
  return CORS_ORIGINS.includes(origin)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const origin = request.headers.get('origin')
  const ip = getClientIP(request)

  // Create response
  let response = NextResponse.next()

  // Handle preflight requests
  if (method === 'OPTIONS') {
    response = new NextResponse(null, { status: 200 })
  }

  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    response.headers.set(header, value)
  })

  // Apply CORS headers
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    Object.entries(CORS_HEADERS).forEach(([header, value]) => {
      response.headers.set(header, value)
    })
  }

  // Apply rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    let limit = 100 // Default requests per minute
    let windowMs = 60000 // 1 minute
    
    // Different rate limits for different endpoints
    if (pathname.startsWith('/api/auth/login')) {
      limit = 5 // 5 attempts per minute for login
    } else if (pathname.startsWith('/api/auth/')) {
      limit = 20 // 20 requests per minute for auth endpoints
    } else if (pathname.startsWith('/api/linkedin/')) {
      limit = 30 // 30 requests per minute for LinkedIn endpoints
    } else if (pathname.startsWith('/api/intelligence/')) {
      limit = 50 // 50 requests per minute for intelligence endpoints
    }
    
    if (isRateLimited(ip, pathname, limit, windowMs)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            ...Object.fromEntries(Object.entries(SECURITY_HEADERS)),
            ...(origin && isOriginAllowed(origin) && {
              'Access-Control-Allow-Origin': origin,
              ...CORS_HEADERS
            })
          }
        }
      )
    }
  }

  // Add cache control headers for static assets
  if (pathname.startsWith('/_next/static/') || pathname.includes('.')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // Add no-cache headers for sensitive pages
  if (pathname.startsWith('/dashboard/') || pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}