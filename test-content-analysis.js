#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🧪 Testing enhanced content analysis system...')

async function testContentAnalysis() {
  try {
    // Get Linda's intelligence profile
    const { data: profile } = await supabase
      .from('connection_intelligence_profiles')
      .select(`
        connection_name,
        company,
        unified_scores,
        confidence_level,
        verification_status,
        strengths,
        recommendations,
        linkedin_analysis_id
      `)
      .eq('connection_id', '831947ab-3bf1-4add-aee2-2b8e68e88253')
      .single()
    
    if (!profile) {
      console.log('❌ No intelligence profile found - run research first')
      return
    }

    console.log('✅ Intelligence Profile Found:')
    console.log('   Name:', profile.connection_name)
    console.log('   Company:', profile.company)
    console.log('   Overall Expertise:', profile.unified_scores?.overallExpertise || 'N/A')
    console.log('   Talent Management:', profile.unified_scores?.talentManagement || 'N/A')
    console.log('   Confidence:', profile.confidence_level)
    console.log('   Status:', profile.verification_status)
    console.log('')

    // Get detailed LinkedIn analysis
    if (profile.linkedin_analysis_id) {
      const { data: analysis } = await supabase
        .from('linkedin_deep_analysis')
        .select('posts_analysis')
        .eq('id', profile.linkedin_analysis_id)
        .single()
      
      if (analysis && analysis.posts_analysis) {
        const posts = analysis.posts_analysis
        console.log('📊 LinkedIn Posts Analysis:')
        console.log(`   - ${posts.length} posts analyzed`)
        
        // Show content themes
        const relevantPosts = posts.filter(p => p.topicRelevance > 30)
        console.log(`   - ${relevantPosts.length} posts with high topic relevance`)
        
        // Show expertise signals found
        const allSignals = posts.flatMap(p => p.expertiseSignals || [])
        console.log(`   - ${allSignals.length} expertise signals identified`)
        
        if (relevantPosts.length > 0) {
          console.log('')
          console.log('🔥 High Relevance Content Examples:')
          relevantPosts.slice(0, 3).forEach((post, i) => {
            console.log(`   ${i+1}. Relevance: ${post.topicRelevance}, Type: ${post.contentType}`)
            console.log(`      "${post.content.substring(0, 100)}..."`)
            if (post.expertiseSignals?.length > 0) {
              console.log(`      Signals: ${post.expertiseSignals.map(s => s.signal).join(', ')}`)
            }
            console.log('')
          })
        }

        // Show content type distribution
        const contentTypes = posts.reduce((acc, post) => {
          acc[post.contentType] = (acc[post.contentType] || 0) + 1
          return acc
        }, {})
        
        console.log('📈 Content Type Distribution:')
        Object.entries(contentTypes).forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`)
        })
      }
    }

    // Show strengths and recommendations
    if (profile.strengths?.length > 0) {
      console.log('')
      console.log('💪 Key Strengths:')
      profile.strengths.forEach(strength => {
        console.log(`   • ${strength}`)
      })
    }

    if (profile.recommendations?.length > 0) {
      console.log('')
      console.log('🎯 Recommendations:')
      profile.recommendations.forEach(rec => {
        console.log(`   • ${rec}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testContentAnalysis()