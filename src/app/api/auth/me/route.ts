import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

async function getCurrentUserHandler(request: AuthenticatedRequest) {
  if (request.method !== 'GET') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  try {
    // Return current user information
    return NextResponse.json({
      user: {
        id: request.user.id,
        email: request.user.email,
        full_name: request.user.full_name,
        role: request.user.role,
        is_active: request.user.is_active,
        created_at: request.user.created_at,
        last_login: request.user.last_login
      }
    })

  } catch (error) {
    console.error('Get current user error:', error)
    
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getCurrentUserHandler)