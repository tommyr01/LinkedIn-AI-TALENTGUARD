import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseLinkedIn } from '@/lib/supabase-linkedin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('id')

    if (!connectionId) {
      return NextResponse.json({ 
        success: false,
        error: 'Connection ID is required' 
      }, { status: 400 })
    }

    console.log(`🗑️ Deleting connection with ID: ${connectionId}`)
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // First, check if the connection exists
    const { data: existingConnection, error: fetchError } = await supabase
      .from('linkedin_connections')
      .select('id, full_name')
      .eq('id', connectionId)
      .single()

    if (fetchError || !existingConnection) {
      console.log('❌ Connection not found:', connectionId)
      return NextResponse.json({ 
        success: false,
        error: 'Connection not found' 
      }, { status: 404 })
    }

    console.log(`🔍 Found connection to delete: ${existingConnection.full_name}`)

    // Delete related data first to maintain referential integrity
    
    // 1. Delete intelligence profile if exists
    if (supabaseLinkedIn) {
      try {
        await supabaseLinkedIn.deleteIntelligenceProfile(connectionId)
        console.log('✅ Deleted intelligence profile for connection')
      } catch (error) {
        console.warn('⚠️ No intelligence profile found or error deleting:', error)
      }
    }

    // 2. Delete connection posts
    const { error: postsError } = await supabase
      .from('connection_posts')
      .delete()
      .eq('connection_id', connectionId)

    if (postsError) {
      console.warn('⚠️ Error deleting connection posts:', postsError.message)
    } else {
      console.log('✅ Deleted connection posts')
    }

    // 3. Delete any other related data (add more as needed)
    // You can add more related table deletions here

    // Finally, delete the main connection record
    const { error: deleteError } = await supabase
      .from('linkedin_connections')
      .delete()
      .eq('id', connectionId)

    if (deleteError) {
      console.error('❌ Error deleting connection:', deleteError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to delete connection',
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log(`✅ Successfully deleted connection: ${existingConnection.full_name}`)

    return NextResponse.json({ 
      success: true,
      message: `Connection "${existingConnection.full_name}" deleted successfully`,
      data: { 
        deletedConnection: existingConnection 
      }
    })

  } catch (error: any) {
    console.error('❌ Error in delete connection API:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}