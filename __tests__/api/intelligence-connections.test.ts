/**
 * API Tests for Intelligence Connections Endpoints
 * Tests /api/intelligence/connections routes
 */

import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/intelligence/connections/route'
import '@/test/mocks/supabase.mock'
import '@/test/mocks/linkedin.mock'

describe('/api/intelligence/connections', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/intelligence/connections', () => {
    it('should return LinkedIn connections successfully', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/connections?limit=50'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.connections).toBeInstanceOf(Array)
      expect(data.data.total).toBeGreaterThanOrEqual(0)
      expect(data.data.meta.limit).toBe(50)
    })

    it('should filter connections by search query', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/connections?search=john&limit=25'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.meta.search).toBe('john')
    })

    it('should handle database connection errors', async () => {
      // Mock Supabase error
      const mockSupabaseLinkedIn = require('@/lib/supabase-linkedin').supabaseLinkedIn
      mockSupabaseLinkedIn.getConnections.mockRejectedValueOnce(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/connections'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch connections')
    })

    it('should return proper connection data structure', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/connections?limit=1'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.connections.length > 0) {
        const connection = data.data.connections[0]
        expect(connection).toHaveProperty('id')
        expect(connection).toHaveProperty('full_name')
        expect(connection).toHaveProperty('current_company')
        expect(connection).toHaveProperty('title')
        expect(connection).toHaveProperty('username')
        expect(connection).toHaveProperty('follower_count')
      }
    })
  })

  describe('POST /api/intelligence/connections', () => {
    it('should start connection sync successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/connections',
        body: {
          source: 'linkedin_api'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Connection sync started')
      expect(data.data.syncId).toBeDefined()
      expect(data.data.source).toBe('linkedin_api')
      expect(data.data.status).toBe('in_progress')
    })

    it('should handle missing request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/connections'
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.source).toBe('linkedin_api') // default value
    })

    it('should handle invalid request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/intelligence/connections',
        body: 'invalid json'
      })

      // Mock JSON parsing error
      jest.spyOn(req, 'json').mockRejectedValueOnce(new Error('Invalid JSON'))

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200) // Still succeeds with defaults
      expect(data.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase configuration errors', async () => {
      // Mock Supabase not configured
      const { isSupabaseConfigured } = require('@/lib/supabase')
      isSupabaseConfigured.mockReturnValueOnce(false)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/connections'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Supabase not configured properly')
    })

    it('should handle missing Supabase LinkedIn service', async () => {
      // Mock supabaseLinkedIn as null
      jest.doMock('@/lib/supabase-linkedin', () => ({
        supabaseLinkedIn: null
      }))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/connections'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Supabase LinkedIn service not available')
    })
  })

  describe('Performance Tests', () => {
    it('should handle large limit values', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/intelligence/connections?limit=1000'
      })

      const startTime = Date.now()
      const response = await GET(req as any)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle complex search queries', async () => {
      const { req } = createMocks({
        method: 'GET', 
        url: '/api/intelligence/connections?search=VP%20Technology%20San%20Francisco'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})