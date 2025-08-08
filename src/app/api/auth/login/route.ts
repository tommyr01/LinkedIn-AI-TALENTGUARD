import { NextRequest, NextResponse } from 'next/server'
import { loginUser, logAuditEvent } from '@/lib/auth'
import { withRateLimit } from '@/lib/auth-middleware'
import { loginSchema, validateInput, formatValidationErrors, sanitizeString } from '@/lib/validation'

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

async function loginHandler(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  const ipAddress = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    const body = await request.json()
    
    // Validate request body using our validation framework
    const validationResult = validateInput(loginSchema, body)
    if (!validationResult.success) {
      await logAuditEvent(
        null,
        'LOGIN_VALIDATION_ERROR',
        'authentication',
        ipAddress,
        userAgent,
        false,
        'Invalid login request format'
      )
      
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: formatValidationErrors(validationResult.errors!)
        },
        { status: 400 }
      )
    }

    // Sanitize input data
    const { email, password } = validationResult.data!
    const sanitizedEmail = sanitizeString(email)

    // Attempt login
    const authSession = await loginUser(
      { email: sanitizedEmail, password },
      ipAddress,
      userAgent
    )

    // Set httpOnly cookie for token
    const response = NextResponse.json({
      success: true,
      user: {
        id: authSession.user.id,
        email: authSession.user.email,
        full_name: authSession.user.full_name,
        role: authSession.user.role
      },
      expires_at: authSession.expires_at
    })

    // Set secure cookie
    response.cookies.set('auth-token', authSession.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Login failed'
    
    await logAuditEvent(
      null,
      'LOGIN_ERROR',
      'authentication',
      ipAddress,
      userAgent,
      false,
      errorMessage
    )

    // Return generic error message to prevent user enumeration
    if (errorMessage.includes('Invalid email or password') || 
        errorMessage.includes('Account is temporarily locked')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 5 login attempts per minute per IP
export const POST = withRateLimit(loginHandler, {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (request: NextRequest) => {
    return `login_${getClientIP(request)}`
  }
})