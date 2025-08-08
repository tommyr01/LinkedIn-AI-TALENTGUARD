/**
 * Mock Web Research and Perplexity services for testing
 * Provides realistic research data responses
 */

export const mockPerplexityResponse = {
  choices: [
    {
      message: {
        content: 'TechCorp Inc is a leading enterprise technology company founded in 2018, specializing in cloud infrastructure and data analytics solutions. Recent developments include:\n\n• $50M Series B funding round led by Acme Ventures (January 2024)\n• Expansion into European markets with new London office\n• Strategic partnership with CloudProvider for enterprise integrations\n• Growing team from 300 to 500+ employees in past year\n\nKey leadership includes CEO Sarah Williams (former VP at BigTech) and CTO Michael Chen (ex-Google). The company focuses on helping enterprises modernize their data infrastructure and has notable clients including Fortune 500 companies in finance and healthcare sectors.'
      }
    }
  ]
}

export const mockWebResearchResults = {
  companyInfo: {
    name: 'TechCorp Inc',
    industry: 'Enterprise Technology',
    founded: 2018,
    headquarters: 'San Francisco, CA',
    size: '500-1000 employees',
    description: 'Leading provider of cloud infrastructure and data analytics solutions for enterprises'
  },
  
  recentNews: [
    {
      title: 'TechCorp Raises $50M Series B to Expand European Operations',
      date: '2024-01-15',
      source: 'TechCrunch',
      summary: 'Company plans to use funding for international expansion and product development',
      url: 'https://techcrunch.com/techcorp-series-b'
    },
    {
      title: 'TechCorp Partners with CloudProvider for Enterprise Integration',
      date: '2024-01-10',
      source: 'VentureBeat',
      summary: 'Strategic partnership aims to simplify cloud migrations for enterprise clients',
      url: 'https://venturebeat.com/techcorp-partnership'
    }
  ],
  
  keyExecutives: [
    {
      name: 'Sarah Williams',
      title: 'CEO',
      background: 'Former VP of Product at BigTech, 15+ years in enterprise software',
      linkedinUrl: 'https://linkedin.com/in/sarahwilliams'
    },
    {
      name: 'Michael Chen', 
      title: 'CTO',
      background: 'Ex-Google Senior Engineer, expert in distributed systems',
      linkedinUrl: 'https://linkedin.com/in/michaelchen'
    }
  ],
  
  businessInitiatives: [
    'Cloud infrastructure modernization platform',
    'AI-powered data analytics suite',
    'European market expansion',
    'Enterprise security compliance (SOC2, GDPR)',
    'Developer productivity tools'
  ],
  
  competitiveLandscape: [
    'Primary competitors: DataCorp, CloudFirst, AnalyticsPro',
    'Differentiators: Speed of deployment, integrated analytics',
    'Market position: Fast-growing challenger in $50B cloud infrastructure market'
  ],
  
  talentSignals: [
    'Rapid hiring in engineering and sales roles',
    'Focus on senior talent with enterprise software experience',  
    'Building out people operations and HR infrastructure',
    'Emphasis on diversity and inclusion initiatives',
    'Remote-first culture with quarterly team gatherings'
  ]
}

export const createMockWebResearchService = () => ({
  researchCompany: jest.fn().mockResolvedValue(mockWebResearchResults),
  
  researchPerson: jest.fn().mockResolvedValue({
    professionalBackground: 'VP of People Operations with 10+ years experience in scaling technology companies',
    expertise: ['HR Technology', 'People Analytics', 'Organizational Development'],
    recentActivity: [
      'Speaker at HR Tech Conference 2024',
      'Published article on data-driven performance management',
      'Led successful transition to remote-first culture'
    ],
    thoughtLeadership: [
      'Active LinkedIn contributor with 5K+ followers',
      'Regular contributor to HR industry publications',
      'Recognized as "HR Tech Innovator" by People Magazine'
    ],
    currentFocus: [
      'Performance management system overhaul',
      'Employee engagement analytics implementation', 
      'Leadership development program design'
    ]
  }),
  
  generateInsights: jest.fn().mockResolvedValue({
    opportunityScore: 85,
    buyingSignals: [
      'Recently raised funding indicates budget availability',
      'Rapid growth requires scalable HR infrastructure',
      'Current focus on people operations suggests timing alignment'
    ],
    recommendations: [
      'Focus on performance management and analytics capabilities',
      'Emphasize scalability for growing organization',
      'Highlight integration capabilities with existing tech stack'
    ],
    keyTalkingPoints: [
      'ROI of unified talent management platform',
      'Success stories from similar high-growth tech companies',
      'Data-driven approach to people development'
    ]
  })
})

export const createMockPerplexityService = () => ({
  search: jest.fn().mockImplementation(async (query: string) => {
    if (query.toLowerCase().includes('techcorp')) {
      return mockPerplexityResponse
    }
    
    // Default response for other queries
    return {
      choices: [{
        message: {
          content: `Research results for: ${query}\n\nThis is a mock response providing general information about the queried topic. Key points include industry context, recent developments, and relevant insights for business intelligence purposes.`
        }
      }]
    }
  })
})

// Jest mocks for web research modules
jest.mock('@/lib/web-research-service', () => ({
  WebResearchService: jest.fn().mockImplementation(() => createMockWebResearchService()),
  webResearchService: createMockWebResearchService()
}))

// Mock fetch for external API calls
global.fetch = jest.fn().mockImplementation(async (url: string) => {
  // Mock Perplexity API
  if (url.includes('api.perplexity.ai')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockPerplexityResponse
    }
  }
  
  // Mock other external APIs
  return {
    ok: true,
    status: 200,
    json: async () => ({ message: 'Mock API response' }),
    text: async () => 'Mock text response'
  }
}) as jest.Mock

export const mockWebResearchService = createMockWebResearchService()
export const mockPerplexityService = createMockPerplexityService()