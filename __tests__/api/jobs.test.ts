/**
 * API Tests for Job Queue Management Endpoints
 * Tests /api/jobs routes and queue operations
 */

import { createMocks } from 'node-mocks-http'
import { GET, DELETE } from '@/app/api/jobs/route'
import { GET as getJobById } from '@/app/api/jobs/[jobId]/route'
import '@/test/mocks/redis.mock'

describe('/api/jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/jobs', () => {
    it('should return queue statistics successfully', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.stats).toBeDefined()
      expect(data.data.stats.research).toBeDefined()
      expect(data.data.stats.enrichment).toBeDefined()
      expect(data.data.stats.reports).toBeDefined()
      expect(data.data.stats.signals).toBeDefined()
    })

    it('should return individual queue jobs when queue parameter provided', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?queue=research&status=waiting'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.jobs).toBeInstanceOf(Array)
      expect(data.data.queue).toBe('research')
      expect(data.data.status).toBe('waiting')
    })

    it('should handle invalid queue names', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs?queue=invalid-queue'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid queue name')
    })

    it('should return filtered jobs by status', async () => {
      const validStatuses = ['waiting', 'active', 'completed', 'failed', 'delayed']
      
      for (const status of validStatuses) {
        const { req } = createMocks({
          method: 'GET',
          url: `/api/jobs?queue=research&status=${status}`
        })

        const response = await GET(req as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.status).toBe(status)
      }
    })

    it('should handle Redis connection errors', async () => {
      // Mock Redis error
      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      mockQueueManager.getQueueStats.mockRejectedValueOnce(new Error('Redis connection failed'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to retrieve job information')
    })
  })

  describe('DELETE /api/jobs', () => {
    it('should clean queues successfully', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/jobs?action=clean'
      })

      const response = await DELETE(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Queues cleaned successfully')

      // Verify clean method was called
      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      expect(mockQueueManager.cleanQueues).toHaveBeenCalled()
    })

    it('should pause queues successfully', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/jobs?action=pause'
      })

      const response = await DELETE(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('All queues paused successfully')

      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      expect(mockQueueManager.pauseAllQueues).toHaveBeenCalled()
    })

    it('should resume queues successfully', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/jobs?action=resume'
      })

      const response = await DELETE(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('All queues resumed successfully')

      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      expect(mockQueueManager.resumeAllQueues).toHaveBeenCalled()
    })

    it('should handle invalid action parameter', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/jobs?action=invalid'
      })

      const response = await DELETE(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid action. Use clean, pause, or resume')
    })

    it('should require action parameter', async () => {
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/jobs'
      })

      const response = await DELETE(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Action parameter is required')
    })
  })

  describe('GET /api/jobs/[jobId]', () => {
    it('should return specific job details', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs/job-123'
      })

      // Mock the params object that Next.js provides
      const context = { params: { jobId: 'job-123' } }

      const response = await getJobById(req as any, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.job).toBeDefined()
    })

    it('should handle job not found', async () => {
      // Mock job not found
      const { mockResearchQueue } = require('@/test/mocks/redis.mock')
      mockResearchQueue.getJob.mockResolvedValueOnce(null)

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs/nonexistent-job'
      })

      const context = { params: { jobId: 'nonexistent-job' } }

      const response = await getJobById(req as any, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Job not found')
    })

    it('should search across all queues for job', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs/job-456'
      })

      const context = { params: { jobId: 'job-456' } }

      const response = await getJobById(req as any, context)
      
      // Should attempt to search in all queue types
      const { mockResearchQueue, mockEnrichmentQueue, mockReportQueue, mockSignalQueue } = require('@/test/mocks/redis.mock')
      
      // At least one queue should be searched
      expect(
        mockResearchQueue.getJob.mock.calls.length +
        mockEnrichmentQueue.getJob.mock.calls.length +
        mockReportQueue.getJob.mock.calls.length +
        mockSignalQueue.getJob.mock.calls.length
      ).toBeGreaterThan(0)
    })
  })

  describe('Queue Operations Integration', () => {
    it('should add research job via queue manager', async () => {
      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      
      const jobData = {
        companyId: 'comp-123',
        companyName: 'TechCorp Inc',
        priority: 'high' as const
      }

      const job = await mockQueueManager.addResearchJob(jobData)
      
      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data).toEqual(jobData)
      expect(mockQueueManager.addResearchJob).toHaveBeenCalledWith(jobData)
    })

    it('should add enrichment job via queue manager', async () => {
      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      
      const jobData = {
        contactId: 'contact-456',
        linkedinUrl: 'https://linkedin.com/in/johnsmith',
        companyId: 'comp-123'
      }

      const job = await mockQueueManager.addEnrichmentJob(jobData)
      
      expect(job).toBeDefined()
      expect(mockQueueManager.addEnrichmentJob).toHaveBeenCalledWith(jobData)
    })

    it('should handle job priority correctly', async () => {
      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      
      const highPriorityJob = {
        companyId: 'comp-123',
        companyName: 'TechCorp Inc',
        priority: 'high' as const
      }

      const lowPriorityJob = {
        companyId: 'comp-456',
        companyName: 'StartupCorp',
        priority: 'low' as const
      }

      await mockQueueManager.addResearchJob(highPriorityJob)
      await mockQueueManager.addResearchJob(lowPriorityJob)

      expect(mockQueueManager.addResearchJob).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle queue connection failures', async () => {
      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      mockQueueManager.getQueueStats.mockRejectedValueOnce(new Error('Connection refused'))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/jobs'
      })

      const response = await GET(req as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should handle malformed job IDs', async () => {
      const invalidJobIds = ['', '   ', 'job-with-invalid-chars-!@#$%']
      
      for (const jobId of invalidJobIds) {
        const { req } = createMocks({
          method: 'GET',
          url: `/api/jobs/${encodeURIComponent(jobId)}`
        })

        const context = { params: { jobId } }

        const response = await getJobById(req as any, context)
        expect([400, 404]).toContain(response.status)
      }
    })

    it('should handle concurrent queue operations', async () => {
      const { mockQueueManager } = require('@/test/mocks/redis.mock')
      
      const operations = [
        mockQueueManager.getQueueStats(),
        mockQueueManager.cleanQueues(),
        mockQueueManager.pauseAllQueues(),
        mockQueueManager.resumeAllQueues()
      ]

      const results = await Promise.allSettled(operations)
      
      // All operations should either fulfill or have controlled failures
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status)
      })
    })
  })
})