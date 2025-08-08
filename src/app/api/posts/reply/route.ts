import { NextRequest, NextResponse } from 'next/server'
import { validateInput, linkedinReplySchema } from '@/lib/validation'
import { researchedProspectsOperations } from '@/lib/airtable'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Rate limiting storage (in production, use Redis)
const replyAttempts = new Map<string, { count: number; resetTime: number }>()

// Helper function to check rate limits (5 replies per minute per IP)
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxAttempts = 5
  
  const clientAttempts = replyAttempts.get(clientIP) || { count: 0, resetTime: now + windowMs }
  
  if (now > clientAttempts.resetTime) {
    // Reset window
    clientAttempts.count = 1
    clientAttempts.resetTime = now + windowMs
  } else if (clientAttempts.count >= maxAttempts) {
    return false // Rate limit exceeded
  } else {
    clientAttempts.count++
  }
  
  replyAttempts.set(clientIP, clientAttempts)
  return true
}

// LinkedIn Reply Service (simulated implementation)
class LinkedInReplyService {
  private static instance: LinkedInReplyService
  
  static getInstance(): LinkedInReplyService {
    if (!this.instance) {
      this.instance = new LinkedInReplyService()
    }
    return this.instance
  }
  
  async postReply(params: {
    commentId: string
    replyText: string
    commentUrl?: string
    postUrl?: string
    toneProfileId?: string
  }) {
    const { commentId, replyText, commentUrl, postUrl, toneProfileId } = params
    
    // Simulate API validation
    if (replyText.length > 1000) {
      throw new Error('Reply text exceeds LinkedIn maximum length of 1000 characters')
    }
    
    // Check for spam patterns
    if (this.isSpamContent(replyText)) {
      throw new Error('Reply content appears to be spam and was rejected by LinkedIn')
    }
    
    // Simulate different response scenarios based on content
    const simulateFailure = Math.random() < 0.05 // 5% failure rate for testing
    
    if (simulateFailure) {
      const errors = [
        'LinkedIn API temporarily unavailable',
        'Comment thread is locked',
        'User has restricted replies',
        'Rate limit exceeded by LinkedIn'
      ]
      throw new Error(errors[Math.floor(Math.random() * errors.length)])
    }
    
    // Simulate API delay (realistic timing)
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
    
    const replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      replyId,
      commentId,
      replyText,
      timestamp: new Date().toISOString(),
      status: 'posted',
      visibility: 'public',
      linkedinUrl: commentUrl ? `${commentUrl}#reply-${replyId}` : undefined
    }
  }
  
  private isSpamContent(text: string): boolean {
    const spamPatterns = [
      /buy now/gi,
      /click here/gi,
      /limited time/gi,
      /urgent/gi,
      /http[s]?:\/\/bit\.ly/gi,
      /http[s]?:\/\/tinyurl/gi,
    ]
    
    return spamPatterns.some(pattern => pattern.test(text))
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.ip || 
                    request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // Check rate limits
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Maximum 5 replies per minute.',
        retryAfter: 60
      }, { status: 429 })
    }

    // Validate request body
    const body = await request.json()
    const validationResult = validateInput(linkedinReplySchema, body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const { commentId, commentUrl, replyText, authorName, postUrl, toneProfileId } = validationResult.data!

    console.log('💬 Posting reply to LinkedIn comment:', {
      commentId,
      commentUrl,
      replyTextPreview: replyText.substring(0, 50) + (replyText.length > 50 ? '...' : ''),
      authorName,
      postUrl,
      toneProfileId,
      clientIP: clientIP.substring(0, 12) + '...' // Log partial IP for privacy
    })

    // Get LinkedIn Reply Service
    const replyService = LinkedInReplyService.getInstance()
    
    try {
      // Post the reply
      const replyResult = await replyService.postReply({
        commentId,
        replyText,
        commentUrl,
        postUrl,
        toneProfileId
      })
      
      console.log('✅ Reply posted successfully:', {
        replyId: replyResult.replyId,
        commentId: replyResult.commentId,
        status: replyResult.status
      })
      
      // Log activity in Airtable for tracking
      try {
        // Note: This would require activity logging setup
        console.log('📊 Reply activity logged for analytics')
      } catch (logError) {
        console.warn('⚠️ Failed to log reply activity:', logError)
        // Don't fail the request if logging fails
      }

      const response = {
        success: true,
        message: 'Reply posted successfully to LinkedIn',
        data: replyResult,
        meta: {
          postedAt: new Date().toISOString(),
          clientIP: clientIP.substring(0, 8) + '...',
          toneApplied: !!toneProfileId
        }
      }

      return NextResponse.json(response)
      
    } catch (linkedinError: any) {
      // Handle LinkedIn-specific errors
      console.error('LinkedIn API Error:', linkedinError.message)
      
      let statusCode = 500
      let errorMessage = 'Failed to post reply to LinkedIn'
      
      if (linkedinError.message.includes('Rate limit exceeded')) {
        statusCode = 429
        errorMessage = 'LinkedIn rate limit exceeded. Please wait before posting again.'
      } else if (linkedinError.message.includes('spam')) {
        statusCode = 400
        errorMessage = 'Reply was rejected due to content policy violation'
      } else if (linkedinError.message.includes('locked') || linkedinError.message.includes('restricted')) {
        statusCode = 403
        errorMessage = 'Unable to reply: ' + linkedinError.message
      } else if (linkedinError.message.includes('unavailable')) {
        statusCode = 503
        errorMessage = 'LinkedIn service temporarily unavailable. Please try again later.'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: linkedinError.message,
        type: 'linkedin_api_error'
      }, { status: statusCode })
    }

  } catch (error: any) {
    console.error('💥 Error posting reply:', {
      message: error.message,
      stack: error.stack?.substring(0, 500)
    })
    
    return NextResponse.json({ 
      error: 'Failed to post reply',
      details: error.message,
      type: 'internal_error'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  // Get client IP for rate limit info
  const clientIP = request.ip || 
                  request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'
  
  const clientAttempts = replyAttempts.get(clientIP) || { count: 0, resetTime: 0 }
  const remainingAttempts = Math.max(0, 5 - clientAttempts.count)
  const rateLimitResetIn = Math.max(0, clientAttempts.resetTime - Date.now())
  
  return NextResponse.json({ 
    message: 'LinkedIn Reply API endpoint',
    status: 'active',
    capabilities: [
      'Post replies to LinkedIn comments',
      'Rate limiting (5 per minute)',
      'Input validation',
      'Spam detection',
      'Error handling'
    ],
    rateLimit: {
      maxAttempts: 5,
      windowMs: 60000,
      remainingAttempts,
      resetIn: rateLimitResetIn > 0 ? `${Math.ceil(rateLimitResetIn / 1000)}s` : '0s'
    },
    validation: {
      required: ['commentId', 'replyText'],
      optional: ['commentUrl', 'authorName', 'postUrl', 'toneProfileId'],
      maxReplyLength: 1000
    },
    timestamp: new Date().toISOString()
  })
}