/**
 * Mock Supabase client for testing
 * Provides realistic database operation responses
 */

export interface MockSupabaseResponse<T = any> {
  data: T | null
  error: any
  status: number
  statusText: string
}

// Mock data for different tables
export const mockConnectionData = {
  id: 'conn-123',
  full_name: 'John Smith',
  first_name: 'John',
  last_name: 'Smith',
  current_company: 'TechCorp Inc',
  title: 'VP of People Operations',
  headline: 'VP of People Operations | HR Technology Leader',
  username: 'johnsmith',
  profile_picture_url: 'https://media.licdn.com/profile.jpg',
  follower_count: 5420,
  connection_count: 2500,
  last_synced_at: '2024-01-15T10:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

export const mockIntelligenceProfileData = {
  id: 'intel-456',
  connection_id: 'conn-123',
  connection_name: 'John Smith',
  company: 'TechCorp Inc',
  title: 'VP of People Operations',
  profile_url: 'https://www.linkedin.com/in/johnsmith',
  web_research: {
    companyInfo: 'TechCorp is a leading technology company',
    recentNews: ['Company raised $50M Series B'],
    keyInitiatives: ['Digital transformation', 'Remote work policies']
  },
  linkedin_analysis: {
    posts: 25,
    avgEngagement: 180,
    topTopics: ['HR Technology', 'People Analytics', 'Remote Work']
  },
  unified_scores: {
    overallExpertise: 85,
    talentManagement: 90,
    peopleDevelopment: 80,
    hrTechnology: 88,
    practicalExperience: 85,
    thoughtLeadership: 82
  },
  intelligence_assessment: {
    verificationStatus: 'verified',
    confidenceLevel: 92,
    strengths: [
      'Deep expertise in people operations',
      'Strong thought leadership in HR tech',
      'Proven track record in scaling teams'
    ],
    recommendations: [
      'Focus on performance management solutions',
      'Emphasize data analytics capabilities',
      'Leverage their influence in HR community'
    ],
    redFlags: []
  },
  research_duration: 45,
  researched_at: '2024-01-15T10:30:00Z'
}

export const mockCompanyData = {
  id: 'comp-789',
  name: 'TechCorp Inc',
  domain: 'techcorp.com',
  industry: 'Technology',
  size: '500-1000',
  description: 'Leading technology company focused on enterprise solutions'
}

// Mock Supabase client methods
const createMockQueryBuilder = (mockData: any) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: mockData,
    error: null,
    status: 200,
    statusText: 'OK'
  }),
  // For queries that return arrays
  then: jest.fn().mockResolvedValue({
    data: Array.isArray(mockData) ? mockData : [mockData],
    error: null,
    status: 200,
    statusText: 'OK'
  })
})

export const createMockSupabase = () => ({
  from: jest.fn().mockImplementation((table: string) => {
    switch (table) {
      case 'linkedin_connections':
        return createMockQueryBuilder([mockConnectionData])
      case 'intelligence_profiles':
        return createMockQueryBuilder([mockIntelligenceProfileData])
      case 'companies':
        return createMockQueryBuilder([mockCompanyData])
      default:
        return createMockQueryBuilder({})
    }
  }),
  
  // Storage operations
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-file.jpg' },
        error: null
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(['test']),
        error: null
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.com/test-file.jpg' }
      })
    })
  },
  
  // Auth operations
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    }),
    signIn: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null
    })
  },
  
  // Real-time subscriptions (simplified mock)
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis()
  })
})

// Mock LinkedIn specific Supabase service
export const createMockSupabaseLinkedIn = () => ({
  getConnections: jest.fn().mockResolvedValue([mockConnectionData]),
  getConnection: jest.fn().mockResolvedValue(mockConnectionData),
  upsertConnection: jest.fn().mockResolvedValue(mockConnectionData),
  getIntelligenceProfiles: jest.fn().mockResolvedValue([mockIntelligenceProfileData]),
  getIntelligenceProfile: jest.fn().mockResolvedValue(mockIntelligenceProfileData),
  upsertIntelligenceProfile: jest.fn().mockResolvedValue(mockIntelligenceProfileData),
  getCompanies: jest.fn().mockResolvedValue([mockCompanyData]),
  upsertCompany: jest.fn().mockResolvedValue(mockCompanyData)
})

// Jest mocks for Supabase modules
jest.mock('@/lib/supabase', () => ({
  supabase: createMockSupabase(),
  isSupabaseConfigured: jest.fn().mockReturnValue(true),
  validateSupabaseConfig: jest.fn().mockReturnValue({ valid: true, error: null })
}))

jest.mock('@/lib/supabase-linkedin', () => ({
  supabaseLinkedIn: createMockSupabaseLinkedIn()
}))

export const mockSupabase = createMockSupabase()
export const mockSupabaseLinkedIn = createMockSupabaseLinkedIn()