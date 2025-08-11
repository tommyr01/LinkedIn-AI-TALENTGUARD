// Simple test script to debug Linda Ginac research
import { webResearchService } from './src/lib/web-research-service.ts';
import { linkedInDeepAnalysisService } from './src/lib/linkedin-deep-analysis.ts';

// Create Linda Ginac connection object
const lindaConnection = {
  id: 'test-linda-ginac',
  full_name: 'Linda Ginac',
  current_company: 'TalentGuard',
  title: 'Founder & CEO',
  username: 'lindaginac',
  profile_url: 'https://www.linkedin.com/in/lindaginac/'
};

console.log('🧪 Testing Research Services with Linda Ginac');
console.log('Connection Data:', lindaConnection);

async function testResearch() {
  try {
    console.log('\n--- Starting Web Research ---\n');
    
    // Test web research
    const webResult = await webResearchService.researchConnection(lindaConnection);
    
    console.log('\n✅ Web Research Results:');
    console.log('- Search Query:', webResult.searchQuery);
    console.log('- Articles Found:', webResult.articlesFound.length);
    console.log('- Expertise Signals:', webResult.expertiseSignals.length);
    console.log('- Overall Score:', webResult.overallRelevanceScore);
    
    if (webResult.articlesFound.length > 0) {
      console.log('\nArticles Found:');
      webResult.articlesFound.forEach((article, i) => {
        console.log(`  ${i+1}. ${article.title} (Score: ${article.relevanceScore})`);
        console.log(`     URL: ${article.url}`);
      });
    } else {
      console.log('\n❌ No articles found in web research');
    }
    
    console.log('\n--- Starting LinkedIn Analysis ---\n');
    
    // Test LinkedIn analysis
    const linkedInResult = await linkedInDeepAnalysisService.analyzeConnection(lindaConnection);
    
    console.log('\n✅ LinkedIn Analysis Results:');
    console.log('- Articles Found:', linkedInResult.articles?.length || 0);
    console.log('- Posts Analyzed:', linkedInResult.postsAnalysis?.length || 0);
    console.log('- Main Topics:', linkedInResult.contentThemes?.mainTopics?.length || 0);
    
    if (linkedInResult.articles && linkedInResult.articles.length > 0) {
      console.log('\nLinkedIn Articles:');
      linkedInResult.articles.forEach((article, i) => {
        console.log(`  ${i+1}. ${article.title}`);
        console.log(`     URL: ${article.url}`);
      });
    } else {
      console.log('\n❌ No LinkedIn articles found');
    }
    
  } catch (error) {
    console.error('❌ Research Test Failed:', error);
  }
}

testResearch();