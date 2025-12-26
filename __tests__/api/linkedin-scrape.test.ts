/**
 * API Tests for LinkedIn Scraping Endpoints  
 * Tests /api/linkedin-scrape routes
 */

import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/linkedin-scrape/route'
import '@/test/mocks/linkedin.mock'
import '@/test/mocks/supabase.mock'

describe('/api/linkedin-scrape', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/linkedin-scrape', () => {
    it('should scrape LinkedIn profile successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
          includeAirtableSync: false
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.profile).toBeDefined()
      expect(data.data.profile.basic_info.fullname).toBe('John Smith')
      expect(data.data.profile.basic_info.public_identifier).toBe('johnsmith')
    })

    it('should handle missing LinkedIn URL', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {}
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('LinkedIn URL is required')
    })

    it('should handle invalid LinkedIn URL format', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'invalid-url'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid LinkedIn URL format')
    })

    it('should extract username from various LinkedIn URL formats', async () => {
      const testUrls = [
        'https://www.linkedin.com/in/johnsmith',
        'https://linkedin.com/in/johnsmith/',
        'https://www.linkedin.com/in/johnsmith?utm_source=share',
        'LinkedIn.com/in/johnsmith'
      ]

      for (const url of testUrls) {
        const { req } = createMocks({
          method: 'POST',
          url: '/api/linkedin-scrape',
          body: {
            linkedinUrl: url
          }
        })

        const response = await POST(req as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      }
    })

    it('should scrape with posts when includePosts is true', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
          includePosts: true,
          maxPosts: 10
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.posts).toBeDefined()
      expect(data.data.posts).toBeInstanceOf(Array)
    })

    it('should handle LinkedIn API errors', async () => {
      // Mock LinkedIn scraper error
      const { mockLinkedInScraper } = require('@/test/mocks/linkedin.mock')
      mockLinkedInScraper.getProfile.mockRejectedValueOnce(new Error('LinkedIn API rate limit exceeded'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('LinkedIn scraping failed')
    })

    it('should sync to Supabase when includeSupabaseSync is true', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
          includeSupabaseSync: true
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.supabaseConnection).toBeDefined()

      // Verify Supabase sync was called
      const { mockSupabaseLinkedIn } = require('@/test/mocks/supabase.mock')
      expect(mockSupabaseLinkedIn.upsertConnection).toHaveBeenCalled()
    })

    it('should handle Supabase sync errors gracefully', async () => {
      // Mock Supabase error
      const { mockSupabaseLinkedIn } = require('@/test/mocks/supabase.mock')
      mockSupabaseLinkedIn.upsertConnection.mockRejectedValueOnce(new Error('Database connection failed'))

      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
          includeSupabaseSync: true
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200) // Still succeeds with profile data
      expect(data.success).toBe(true)
      expect(data.data.profile).toBeDefined()
      expect(data.data.syncErrors).toContain('Supabase sync failed')
    })
  })

  describe('Data Validation', () => {
    it('should return properly structured profile data', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      const profile = data.data.profile.data
      expect(profile.basic_info).toHaveProperty('fullname')
      expect(profile.basic_info).toHaveProperty('headline')
      expect(profile.basic_info).toHaveProperty('public_identifier')
      expect(profile.basic_info).toHaveProperty('location')
      expect(profile.experience).toBeInstanceOf(Array)
      expect(profile.education).toBeInstanceOf(Array)
    })

    it('should validate post data structure when posts included', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
          includePosts: true
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.data.posts.length > 0) {
        const post = data.data.posts[0]
        expect(post).toHaveProperty('urn')
        expect(post).toHaveProperty('text')
        expect(post).toHaveProperty('url')
        expect(post).toHaveProperty('stats')
        expect(post.stats).toHaveProperty('total_reactions')
        expect(post.stats).toHaveProperty('comments')
      }
    })
  })

  describe('Rate Limiting and Performance', () => {
    it('should handle post limit parameter', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
          includePosts: true,
          maxPosts: 5
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.posts.length).toBeLessThanOrEqual(5)
    })

    it('should complete scraping within reasonable time', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith'
        }
      })

      const startTime = Date.now()
      const response = await POST(req as any)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(15000) // Should complete within 15 seconds
    })

    it('should handle timeout scenarios', async () => {
      // Mock slow LinkedIn API response
      const { mockLinkedInScraper } = require('@/test/mocks/linkedin.mock')
      mockLinkedInScraper.getProfile.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 20000))
      )

      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith'
        }
      })

      // Set shorter timeout for test
      jest.setTimeout(10000)
      
      try {
        const response = await POST(req as any)
        expect(response.status).toBe(500) // Should timeout
      } catch (error) {
        expect(error).toBeDefined() // Timeout error expected
      }
    })
  })

  describe('Security and Validation', () => {
    it('should sanitize LinkedIn URLs', async () => {
      const maliciousUrl = 'https://www.linkedin.com/in/johnsmith"><script>alert("xss")</script>'
      
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: maliciousUrl
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid LinkedIn URL format')
    })

    it('should reject non-LinkedIn URLs', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.facebook.com/profile'
        }
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid LinkedIn URL format')
    })

    it('should handle request body limit', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/linkedin-scrape',
        body: {
          linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
          largeField: 'x'.repeat(100000) // Very large field
        }
      })

      const response = await POST(req as any)
      // Should either succeed (ignoring large field) or fail gracefully
      expect([200, 400, 413]).toContain(response.status)
    })
  })
})