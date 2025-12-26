import { NextRequest, NextResponse } from 'next/server'
import { registerUser, logAuditEvent } from '@/lib/auth'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { z } from 'zod'

// Validation schema for registration request
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters long'),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
})

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

async function registerHandler(request: AuthenticatedRequest) {
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
    
    // Validate request body
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      await logAuditEvent(
        request.user.id,
        'REGISTER_VALIDATION_ERROR',
        'user_management',
        ipAddress,
        userAgent,
        false,
        'Invalid registration request format'
      )
      
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password, full_name, role } = validationResult.data

    // Create new user
    const newUser = await registerUser({
      email,
      password,
      full_name,
      role
    })

    // Log successful registration
    await logAuditEvent(
      request.user.id,
      'USER_REGISTERED',
      'user_management',
      ipAddress,
      userAgent,
      true,
      undefined,
      {
        new_user_id: newUser.id,
        new_user_email: newUser.email,
        new_user_role: newUser.role
      }
    )

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        created_at: newUser.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Registration failed'
    
    await logAuditEvent(
      request.user.id,
      'REGISTER_ERROR',
      'user_management',
      ipAddress,
      userAgent,
      false,
      errorMessage
    )

    if (errorMessage.includes('User with this email already exists')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    )
  }
}

// Only admins can register new users
export const POST = withAdminAuth(registerHandler)