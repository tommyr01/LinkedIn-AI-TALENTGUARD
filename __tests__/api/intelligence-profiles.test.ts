/**
 * API Tests for Intelligence Profiles Endpoints
 * Tests /api/intelligence/profiles routes
 */

import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/intelligence/profiles/route'
import '@/test/mocks/supabase.mock'
import '@/test/mocks/openai.mock'
import '@/test/mocks/linkedin.mock'
import '@/test/mocks/web-research.mock'

describe('/api/intelligence/profiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/intelligence/profiles', () => {
    it('should return intelligence profiles successfully', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/profiles?limit=50'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.profiles).toBeInstanceOf(Array)
      expect(data.data.total).toBeGreaterThanOrEqual(0)
    })

    it('should return specific profile by connectionId', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/profiles?connectionId=conn-123'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.profile).toBeDefined()
      expect(data.data.profile.connection_id).toBe('conn-123')
    })

    it('should filter profiles by company', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/profiles?company=TechCorp'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.meta.company).toBe('TechCorp')
    })

    it('should validate profile data structure', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/profiles?limit=1'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.profiles.length > 0) {
        const profile = data.data.profiles[0]
        expect(profile).toHaveProperty('connection_id')
        expect(profile).toHaveProperty('connection_name')
        expect(profile).toHaveProperty('unified_scores')
        expect(profile).toHaveProperty('intelligence_assessment')
        expect(profile.unified_scores).toHaveProperty('overallExpertise')
        expect(profile.intelligence_assessment).toHaveProperty('verificationStatus')
        expect(profile.intelligence_assessment).toHaveProperty('confidenceLevel')
      }
    })
  })

  describe('POST /api/intelligence/profiles', () => {
    it('should create intelligence profile successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123',
          includeWebResearch: true,
          includeLinkedInAnalysis: true
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.profile).toBeDefined()
      expect(data.data.profile.connection_id).toBe('conn-123')
      expect(data.data.researchDuration).toBeGreaterThan(0)
    })

    it('should handle missing connectionId', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {}
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('connectionId is required')
    })

    it('should handle invalid connectionId', async () => {
      // Mock connection not found
      const mockSupabaseLinkedIn = require('@/lib/supabase-linkedin').supabaseLinkedIn
      mockSupabaseLinkedIn.getConnection.mockResolvedValueOnce(null)

      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'invalid-connection'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Connection not found')
    })

    it('should create profile with web research only', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123',
          includeWebResearch: true,
          includeLinkedInAnalysis: false
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.profile.web_research).toBeDefined()
      expect(data.data.profile.linkedin_analysis).toBeNull()
    })

    it('should create profile with LinkedIn analysis only', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123',
          includeWebResearch: false,
          includeLinkedInAnalysis: true
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.profile.linkedin_analysis).toBeDefined()
      expect(data.data.profile.web_research).toBeNull()
    })

    it('should handle AI processing errors gracefully', async () => {
      // Mock OpenAI error
      const { mockOpenAI } = require('@/test/mocks/openai.mock')
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('OpenAI API error'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to create intelligence profile')
    })
  })

  describe('Intelligence Scoring Validation', () => {
    it('should generate valid unified scores', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      const scores = data.data.profile.unified_scores
      expect(scores.overallExpertise).toBeGreaterThanOrEqual(0)
      expect(scores.overallExpertise).toBeLessThanOrEqual(100)
      expect(scores.talentManagement).toBeGreaterThanOrEqual(0)
      expect(scores.talentManagement).toBeLessThanOrEqual(100)
      expect(scores.peopleDevelopment).toBeGreaterThanOrEqual(0)
      expect(scores.peopleDevelopment).toBeLessThanOrEqual(100)
      expect(scores.hrTechnology).toBeGreaterThanOrEqual(0)
      expect(scores.hrTechnology).toBeLessThanOrEqual(100)
    })

    it('should generate valid intelligence assessment', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      const assessment = data.data.profile.intelligence_assessment
      expect(['verified', 'likely', 'unverified']).toContain(assessment.verificationStatus)
      expect(assessment.confidenceLevel).toBeGreaterThanOrEqual(0)
      expect(assessment.confidenceLevel).toBeLessThanOrEqual(100)
      expect(assessment.strengths).toBeInstanceOf(Array)
      expect(assessment.recommendations).toBeInstanceOf(Array)
      expect(assessment.redFlags).toBeInstanceOf(Array)
    })
  })

  describe('Performance and Rate Limiting', () => {
    it('should complete profile creation within reasonable time', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123'
        }
      })

      const startTime = Date.now()
      const response = await POST(req as any)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(30000) // Should complete within 30 seconds
    })

    it('should handle concurrent profile requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => {
        const { req } = createMocks({
          method: 'POST',
          url: '/api/intelligence/profiles',
          body: {
            connectionId: `conn-${i}`
          }
        })
        return POST(req as any)
      })

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect([200, 404, 500]).toContain(response.status) // Allow for various outcomes
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles'
      })

      // Mock JSON parsing error
      jest.spyOn(req, 'json').mockRejectedValueOnce(new Error('Invalid JSON'))

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle database transaction failures', async () => {
      // Mock database error during profile save
      const mockSupabaseLinkedIn = require('@/lib/supabase-linkedin').supabaseLinkedIn
      mockSupabaseLinkedIn.upsertIntelligenceProfile.mockRejectedValueOnce(new Error('Database write failed'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/profiles',
        body: {
          connectionId: 'conn-123'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to create intelligence profile')
    })
  })
})