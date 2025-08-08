import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import { logoutUser } from '@/lib/auth'

async function logoutHandler(request: AuthenticatedRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  try {
    // Logout user and invalidate session
    await logoutUser(request.sessionId, request.user.id)

    // Clear auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    response.cookies.delete('auth-token')

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(logoutHandler)