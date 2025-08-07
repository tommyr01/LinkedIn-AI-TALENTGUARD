#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Examining LinkedIn posts data for intelligence reporting...')

async function examineLinkedInPosts() {
  try {
    // Get Linda's connection ID
    const { data: linda } = await supabase
      .from('linkedin_connections')
      .select('id, full_name, title, current_company')
      .ilike('full_name', '%linda%')
      .single()
    
    if (!linda) {
      console.log('❌ Linda not found')
      return
    }
    
    console.log('✅ Found Linda:', linda.full_name)
    console.log('   Title:', linda.title)
    console.log('   Company:', linda.current_company)
    console.log('   ID:', linda.id)
    console.log('')
    
    // Get her LinkedIn posts from connection_posts table
    const { data: connectionPosts, error: postsError } = await supabase
      .from('connection_posts')
      .select('*')
      .eq('connection_id', linda.id)
      .order('posted_date', { ascending: false })
    
    if (postsError) {
      console.log('❌ Error fetching connection posts:', postsError.message)
    } else {
      console.log('📊 Connection posts found:', connectionPosts.length)
      
      if (connectionPosts.length > 0) {
        console.log('')
        console.log('📝 Recent posts analysis:')
        connectionPosts.slice(0, 3).forEach((post, index) => {
          console.log('')
          console.log(`Post ${index + 1}:`)
          console.log('Date:', post.posted_date || 'No date')
          console.log('Content preview:', (post.post_text || 'No content').substring(0, 150) + '...')
          console.log('Reactions:', post.total_reactions || 0)
          console.log('Comments:', post.comments_count || 0)
        })
      }
    }
    
    // Check general linkedin_posts table for any TalentGuard posts
    const { data: allPosts } = await supabase
      .from('linkedin_posts')
      .select('author_first_name, author_last_name, post_text, total_reactions')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('')
    console.log('📊 Total LinkedIn posts in system:', allPosts?.length || 0)
    
    if (allPosts && allPosts.length > 0) {
      console.log('')
      console.log('👥 Recent authors in system:')
      allPosts.forEach(post => {
        const authorName = `${post.author_first_name || ''} ${post.author_last_name || ''}`.trim()
        if (authorName) {
          console.log(`  - ${authorName}`)
        }
      })
    }
    
    console.log('')
    console.log('🎯 Data available for intelligence reporting:')
    if (connectionPosts.length > 0) {
      console.log('✅ LinkedIn posts available for content analysis')
      console.log('✅ Can analyze posting themes and topics')
      console.log('✅ Can extract professional insights')
    } else {
      console.log('⚠️  No LinkedIn posts found for this connection')
      console.log('💡 May need to sync LinkedIn posts for this user')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

examineLinkedInPosts()