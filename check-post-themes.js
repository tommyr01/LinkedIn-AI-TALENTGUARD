#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🎨 Examining Linda\'s LinkedIn post themes and content...')

async function analyzePostThemes() {
  try {
    // Get Linda's posts directly from connection_posts
    const { data: posts } = await supabase
      .from('connection_posts')
      .select('post_text, total_reactions, posted_date')
      .eq('connection_id', '831947ab-3bf1-4add-aee2-2b8e68e88253')
      .order('posted_date', { ascending: false })
    
    if (!posts || posts.length === 0) {
      console.log('❌ No posts found')
      return
    }

    console.log(`📊 Found ${posts.length} posts to analyze`)
    console.log('')

    // Keywords to look for
    const TALENT_KEYWORDS = [
      'talent management', 'talent acquisition', 'talent retention', 'succession planning',
      'performance management', 'employee engagement', 'workforce planning', 'talent strategy'
    ]

    const PEOPLE_DEV_KEYWORDS = [
      'people development', 'leadership development', 'employee development', 'coaching',
      'mentoring', 'training', 'learning and development', 'career development', 'upskilling'
    ]

    const HR_TECH_KEYWORDS = [
      'HR technology', 'HRIS', 'ATS', 'people analytics', 'workforce analytics',
      'HR automation', 'employee experience platform', 'performance management system'
    ]

    // Analyze each post
    let relevantPosts = []
    let talentManagementPosts = []
    let skillsBasedPosts = []

    posts.forEach((post, index) => {
      const content = post.post_text?.toLowerCase() || ''
      let relevanceScore = 0
      let foundKeywords = []

      // Check for talent management themes
      TALENT_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          relevanceScore += 15
          foundKeywords.push(keyword)
        }
      })

      // Check for people development themes
      PEOPLE_DEV_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          relevanceScore += 12
          foundKeywords.push(keyword)
        }
      })

      // Check for HR tech themes
      HR_TECH_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          relevanceScore += 10
          foundKeywords.push(keyword)
        }
      })

      // Check for skills-based content
      if (content.includes('skills') || content.includes('skill-based') || content.includes('skills-based')) {
        relevanceScore += 20
        foundKeywords.push('skills-based approach')
        skillsBasedPosts.push({
          index: index + 1,
          date: post.posted_date,
          content: post.post_text?.substring(0, 200) + '...',
          reactions: post.total_reactions
        })
      }

      if (relevanceScore > 30) {
        relevantPosts.push({
          index: index + 1,
          date: post.posted_date,
          relevanceScore,
          foundKeywords,
          content: post.post_text?.substring(0, 300) + '...',
          reactions: post.total_reactions
        })
      }

      // Check for specific talent management focus
      if (content.includes('talent') || content.includes('succession') || content.includes('workforce')) {
        talentManagementPosts.push({
          index: index + 1,
          date: post.posted_date,
          content: post.post_text?.substring(0, 200) + '...',
          reactions: post.total_reactions
        })
      }
    })

    console.log(`🔥 Found ${relevantPosts.length} highly relevant posts (score > 30):`)
    relevantPosts.slice(0, 5).forEach(post => {
      console.log('')
      console.log(`📝 Post #${post.index} (${post.date}) - Score: ${post.relevanceScore}`)
      console.log(`   Keywords: ${post.foundKeywords.join(', ')}`)
      console.log(`   Engagement: ${post.reactions} reactions`)
      console.log(`   Content: "${post.content}"`)
    })

    console.log('')
    console.log(`🎯 Talent Management Focus - ${talentManagementPosts.length} posts mention talent/workforce:`)
    talentManagementPosts.slice(0, 3).forEach(post => {
      console.log('')
      console.log(`📝 Post #${post.index} (${post.date})`)
      console.log(`   "${post.content}"`)
      console.log(`   Reactions: ${post.reactions}`)
    })

    console.log('')
    console.log(`🛠️ Skills-Based Content - ${skillsBasedPosts.length} posts mention skills:`)
    skillsBasedPosts.slice(0, 3).forEach(post => {
      console.log('')
      console.log(`📝 Post #${post.index} (${post.date})`)
      console.log(`   "${post.content}"`)
      console.log(`   Reactions: ${post.reactions}`)
    })

    // Summary insights
    console.log('')
    console.log('📋 CONTENT ANALYSIS SUMMARY:')
    console.log(`   • Total posts: ${posts.length}`)
    console.log(`   • High relevance posts: ${relevantPosts.length} (${Math.round(relevantPosts.length/posts.length*100)}%)`)
    console.log(`   • Talent management focus: ${talentManagementPosts.length} posts`)
    console.log(`   • Skills-based content: ${skillsBasedPosts.length} posts`)
    
    const avgEngagement = Math.round(posts.reduce((sum, p) => sum + (p.total_reactions || 0), 0) / posts.length)
    console.log(`   • Average engagement: ${avgEngagement} reactions per post`)
    
    const highEngagementPosts = posts.filter(p => (p.total_reactions || 0) > avgEngagement * 1.5).length
    console.log(`   • High engagement posts: ${highEngagementPosts}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

analyzePostThemes()