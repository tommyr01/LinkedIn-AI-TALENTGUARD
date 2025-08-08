import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSession } from '@/lib/auth'
import { validateInput, supportTicketSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 }
  }

  const token = authHeader.slice(7)
  const sessionData = await validateSession(token)
  
  if (!sessionData) {
    return { error: 'Invalid or expired token', status: 401 }
  }

  return { user: sessionData.user, sessionId: sessionData.sessionId }
}

// Function to send notification email (implement with your email service)
async function sendTicketNotification(ticket: any, type: 'created' | 'updated' | 'resolved') {
  try {
    // This would integrate with your email service (SendGrid, Amazon SES, etc.)
    console.log(`📧 Sending ${type} notification for ticket ${ticket.ticket_number}`)
    
    // Example implementation with nodemailer or your preferred email service
    // await emailService.send({
    //   to: ticket.email,
    //   subject: `TalentGuard Support Ticket ${ticket.ticket_number} - ${type}`,
    //   template: `ticket_${type}`,
    //   data: ticket
    // })
    
  } catch (error) {
    console.error('Failed to send ticket notification:', error)
  }
}

// POST - Create support ticket
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    let user = null
    
    // Support tickets can be created by authenticated users or anonymous users
    if (!('error' in authResult)) {
      user = authResult.user
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await request.json()

    // Validate request body
    const validationResult = validateInput(supportTicketSchema, body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid ticket data',
        details: validationResult.errors?.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
        validation_errors: validationResult.errors?.issues
      }, { status: 400 })
    }

    const ticketData = validationResult.data!

    // Generate ticket number
    const ticketNumber = `TG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Determine priority based on category
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      bug: 'high',
      feature_request: 'medium',
      billing: 'high',
      account: 'medium',
      technical: 'high',
      general: 'low'
    }

    const priority = priorityMap[ticketData.category] || 'medium'

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: user?.id || null,
        email: ticketData.email,
        name: ticketData.name,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category,
        priority: priority,
        status: 'open',
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip,
          referer: request.headers.get('referer'),
          browser_info: ticketData.browser_info,
          system_info: ticketData.system_info
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating support ticket:', ticketError)
      return NextResponse.json({
        error: 'Failed to create support ticket',
        details: ticketError.message
      }, { status: 500 })
    }

    // Send notification email
    await sendTicketNotification(ticket, 'created')

    // Log ticket creation for analytics
    console.log(`✅ Support ticket created: ${ticket.ticket_number} by ${ticket.email}`)

    return NextResponse.json({
      success: true,
      data: {
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at
      },
      message: 'Support ticket created successfully. You will receive email updates.'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in POST support ticket:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// GET - Fetch support tickets
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)
    const searchParams = request.nextUrl.searchParams

    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    // Build query
    let query = supabase
      .from('support_tickets')
      .select(`
        id,
        ticket_number,
        subject,
        description,
        category,
        priority,
        status,
        created_at,
        updated_at,
        resolved_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Error fetching support tickets:', error)
      return NextResponse.json({
        error: 'Failed to fetch support tickets',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: tickets || [],
      meta: {
        user_id: user.id,
        limit,
        offset,
        filters: {
          status,
          category
        }
      }
    })

  } catch (error: any) {
    console.error('Error in GET support tickets:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update support ticket (user can add comments, admin can update status)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await request.json()

    const { ticket_number, comment, rating, status } = body

    if (!ticket_number) {
      return NextResponse.json({
        error: 'Ticket number is required'
      }, { status: 400 })
    }

    // Verify ticket ownership
    const { data: existingTicket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('ticket_number', ticket_number)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTicket) {
      return NextResponse.json({
        error: 'Ticket not found or access denied'
      }, { status: 404 })
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Add comment to ticket
    if (comment) {
      const existingComments = existingTicket.comments || []
      updates.comments = [
        ...existingComments,
        {
          id: `comment_${Date.now()}`,
          author: 'user',
          author_id: user.id,
          author_name: user.full_name || user.email,
          message: comment,
          created_at: new Date().toISOString()
        }
      ]
      
      // Reopen ticket if user adds comment to resolved ticket
      if (existingTicket.status === 'resolved') {
        updates.status = 'open'
        updates.resolved_at = null
      }
    }

    // Add rating (for resolved tickets)
    if (rating && existingTicket.status === 'resolved') {
      updates.customer_rating = rating
    }

    // Update status (admin only - would need role check)
    if (status && user.role === 'admin') {
      updates.status = status
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString()
      }
    }

    // Update ticket
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', existingTicket.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating support ticket:', updateError)
      return NextResponse.json({
        error: 'Failed to update support ticket',
        details: updateError.message
      }, { status: 500 })
    }

    // Send notification for significant updates
    if (comment || (status && status !== existingTicket.status)) {
      await sendTicketNotification(updatedTicket, 'updated')
    }

    console.log(`✅ Support ticket updated: ${ticket_number}`)

    return NextResponse.json({
      success: true,
      data: {
        ticket_number: updatedTicket.ticket_number,
        status: updatedTicket.status,
        updated_at: updatedTicket.updated_at
      },
      message: 'Support ticket updated successfully'
    })

  } catch (error: any) {
    console.error('Error in PUT support ticket:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}