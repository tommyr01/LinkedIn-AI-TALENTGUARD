#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('📋 GENERATING COMPREHENSIVE PROFESSIONAL REPORT FOR LINDA GINAC')
console.log('=' * 80)

async function generateReport() {
  try {
    // Get Linda's connection data
    const { data: linda } = await supabase
      .from('linkedin_connections')
      .select('*')
      .eq('id', '831947ab-3bf1-4add-aee2-2b8e68e88253')
      .single()

    // Get intelligence profile
    const { data: profile } = await supabase
      .from('connection_intelligence_profiles')
      .select('*')
      .eq('connection_id', '831947ab-3bf1-4add-aee2-2b8e68e88253')
      .single()

    // Get LinkedIn posts
    const { data: posts } = await supabase
      .from('connection_posts')
      .select('*')
      .eq('connection_id', '831947ab-3bf1-4add-aee2-2b8e68e88253')
      .order('posted_date', { ascending: false })

    console.log('')
    console.log('👤 PROFESSIONAL PROFILE')
    console.log('━'.repeat(50))
    console.log(`Name: ${linda.full_name}`)
    console.log(`Title: ${linda.title}`)
    console.log(`Company: ${linda.current_company}`)
    console.log(`LinkedIn: ${linda.profile_url}`)
    console.log(`Location: ${linda.location || 'Not specified'}`)
    
    if (linda.headline) {
      console.log(`Headline: ${linda.headline}`)
    }

    console.log('')
    console.log('📊 EXPERTISE ASSESSMENT')
    console.log('━'.repeat(50))
    if (profile && profile.unified_scores) {
      const scores = profile.unified_scores
      console.log(`Overall Expertise Score: ${scores.overallExpertise || 0}/100`)
      console.log(`Talent Management: ${scores.talentManagement || 0}/100`)
      console.log(`People Development: ${scores.peopleDevelopment || 0}/100`)
      console.log(`HR Technology: ${scores.hrTechnology || 0}/100`)
      console.log(`Leadership: ${scores.leadership || 0}/100`)
      console.log(`Confidence Level: ${profile.confidence_level || 0}%`)
      console.log(`Verification Status: ${profile.verification_status || 'unverified'}`)
    } else {
      console.log('No expertise scores available')
    }

    console.log('')
    console.log('📝 LINKEDIN CONTENT ANALYSIS')
    console.log('━'.repeat(50))
    
    if (!posts || posts.length === 0) {
      console.log('No LinkedIn posts available for analysis')
      return
    }

    console.log(`Total Posts Analyzed: ${posts.length}`)
    
    // Calculate posting frequency
    const postDates = posts.map(p => new Date(p.posted_date)).filter(d => !isNaN(d.getTime())).sort((a, b) => b - a)
    if (postDates.length > 1) {
      const monthsSpan = Math.max(1, (postDates[0] - postDates[postDates.length - 1]) / (1000 * 60 * 60 * 24 * 30))
      const postsPerMonth = Math.round((posts.length / monthsSpan) * 10) / 10
      console.log(`Posting Frequency: ${postsPerMonth} posts per month`)
    }
    
    const avgEngagement = Math.round(posts.reduce((sum, p) => sum + (p.total_reactions || 0), 0) / posts.length)
    console.log(`Average Engagement: ${avgEngagement} reactions per post`)

    // Analyze content themes
    const TALENT_KEYWORDS = [
      'talent management', 'talent acquisition', 'talent retention', 'succession planning',
      'performance management', 'employee engagement', 'workforce planning', 'talent strategy'
    ]

    const PEOPLE_DEV_KEYWORDS = [
      'people development', 'leadership development', 'employee development', 'coaching',
      'mentoring', 'training', 'learning and development', 'career development', 'upskilling'
    ]

    let themeAnalysis = {
      talentManagement: [],
      skillsBased: [],
      thoughtLeadership: [],
      caseStudies: [],
      personal: []
    }

    let allFoundKeywords = new Set()

    posts.forEach((post, index) => {
      const content = post.post_text?.toLowerCase() || ''
      let foundKeywords = []

      // Check for talent management themes
      TALENT_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          foundKeywords.push(keyword)
          allFoundKeywords.add(keyword)
        }
      })

      PEOPLE_DEV_KEYWORDS.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          foundKeywords.push(keyword)
          allFoundKeywords.add(keyword)
        }
      })

      // Categorize posts
      if (foundKeywords.length > 0) {
        themeAnalysis.talentManagement.push({
          date: post.posted_date,
          content: post.post_text?.substring(0, 200),
          reactions: post.total_reactions,
          keywords: foundKeywords
        })
      }

      if (content.includes('skills') || content.includes('skill-based')) {
        themeAnalysis.skillsBased.push({
          date: post.posted_date,
          content: post.post_text?.substring(0, 200),
          reactions: post.total_reactions
        })
      }

      if (content.includes('framework') || content.includes('strategy') || content.includes('approach')) {
        themeAnalysis.thoughtLeadership.push({
          date: post.posted_date,
          content: post.post_text?.substring(0, 200),
          reactions: post.total_reactions
        })
      }

      if (content.includes('case study') || content.includes('example')) {
        themeAnalysis.caseStudies.push({
          date: post.posted_date,
          content: post.post_text?.substring(0, 200),
          reactions: post.total_reactions
        })
      }
    })

    console.log('')
    console.log('🎯 TALENT MANAGEMENT & PEOPLE DEVELOPMENT FOCUS')
    console.log('━'.repeat(50))
    console.log(`Posts with Talent/HR Themes: ${themeAnalysis.talentManagement.length}/${posts.length} (${Math.round(themeAnalysis.talentManagement.length/posts.length*100)}%)`)
    console.log(`Skills-Based Content: ${themeAnalysis.skillsBased.length} posts`)
    console.log(`Thought Leadership Posts: ${themeAnalysis.thoughtLeadership.length} posts`)
    console.log(`Case Studies/Examples: ${themeAnalysis.caseStudies.length} posts`)
    
    if (allFoundKeywords.size > 0) {
      console.log(`Expert Topics: ${Array.from(allFoundKeywords).join(', ')}`)
    }

    console.log('')
    console.log('📚 CONTENT THEMES - WHAT LINDA POSTS ABOUT')
    console.log('━'.repeat(50))

    // Show talent management posts
    if (themeAnalysis.talentManagement.length > 0) {
      console.log('')
      console.log('🔥 TALENT MANAGEMENT & HR EXPERTISE:')
      themeAnalysis.talentManagement.slice(0, 3).forEach((post, i) => {
        console.log(`\n${i + 1}. ${post.date} (${post.reactions} reactions)`)
        console.log(`   Keywords: ${post.keywords.join(', ')}`)
        console.log(`   "${post.content}..."`)
      })
    }

    // Show skills-based posts  
    if (themeAnalysis.skillsBased.length > 0) {
      console.log('')
      console.log('🛠️  SKILLS-BASED TRANSFORMATION EXPERTISE:')
      themeAnalysis.skillsBased.slice(0, 3).forEach((post, i) => {
        console.log(`\n${i + 1}. ${post.date} (${post.reactions} reactions)`)
        console.log(`   "${post.content}..."`)
      })
    }

    // Show thought leadership
    if (themeAnalysis.thoughtLeadership.length > 0) {
      console.log('')
      console.log('💭 THOUGHT LEADERSHIP & STRATEGIC INSIGHTS:')
      themeAnalysis.thoughtLeadership.slice(0, 3).forEach((post, i) => {
        console.log(`\n${i + 1}. ${post.date} (${post.reactions} reactions)`)
        console.log(`   "${post.content}..."`)
      })
    }

    // High engagement posts
    const highEngagementPosts = posts
      .filter(p => (p.total_reactions || 0) > avgEngagement * 1.5)
      .sort((a, b) => (b.total_reactions || 0) - (a.total_reactions || 0))
      .slice(0, 5)

    if (highEngagementPosts.length > 0) {
      console.log('')
      console.log('🚀 HIGH ENGAGEMENT CONTENT')
      console.log('━'.repeat(50))
      highEngagementPosts.forEach((post, i) => {
        console.log(`\n${i + 1}. ${post.posted_date} (${post.total_reactions} reactions)`)
        console.log(`   "${post.post_text?.substring(0, 300)}..."`)
      })
    }

    console.log('')
    console.log('🎯 KEY FINDINGS & RECOMMENDATIONS')
    console.log('━'.repeat(50))
    
    // Generate insights
    const talentFocusPercentage = Math.round(themeAnalysis.talentManagement.length/posts.length*100)
    const skillsExpertise = themeAnalysis.skillsBased.length
    
    console.log(`✅ TALENT MANAGEMENT EXPERT: ${talentFocusPercentage}% of posts focus on talent/HR themes`)
    
    if (skillsExpertise >= 5) {
      console.log(`✅ SKILLS-BASED TRANSFORMATION EXPERT: ${skillsExpertise} posts demonstrate skills-based approach expertise`)
    }
    
    if (avgEngagement > 15) {
      console.log(`✅ HIGH ENGAGEMENT: Average ${avgEngagement} reactions shows strong industry following`)
    }
    
    const hasThoughtLeadership = themeAnalysis.thoughtLeadership.length >= 3
    if (hasThoughtLeadership) {
      console.log(`✅ THOUGHT LEADER: ${themeAnalysis.thoughtLeadership.length} strategic/framework posts show industry thought leadership`)
    }

    // Special mention for talent management content
    if (talentFocusPercentage >= 30) {
      console.log('')
      console.log('🏆 SPECIAL MENTION: TALENT MANAGEMENT EXPERTISE')
      console.log('This individual demonstrates significant expertise in talent management and people development:')
      console.log(`• ${talentFocusPercentage}% of LinkedIn content focuses on talent/HR topics`)
      console.log(`• Regular discussion of skills-based approaches and workforce transformation`)
      console.log(`• Active thought leadership in succession planning and employee development`)
      console.log(`• Strong industry engagement with average ${avgEngagement} reactions per post`)
    }

    console.log('')
    console.log('=' * 80)
    console.log('End of Professional Intelligence Report')
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message)
  }
}

generateReport()