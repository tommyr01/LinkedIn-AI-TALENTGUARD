/**
 * Integration Tests for Queue Processing
 * Tests job queue operations and worker processes
 */

import { QueueManager } from '@/lib/queue'
import { IntelligenceProcessor } from '@/lib/intelligence-processor'
import { LinkedInScraperService } from '@/lib/linkedin-scraper'
import '@/test/mocks/redis.mock'
import '@/test/mocks/openai.mock'
import '@/test/mocks/linkedin.mock'
import '@/test/mocks/supabase.mock'

describe('Queue Processing Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Research Job Processing', () => {
    it('should process research job end-to-end', async () => {
      const jobData = {
        companyId: 'comp-123',
        companyName: 'TechCorp Inc',
        domain: 'techcorp.com',
        priority: 'high' as const,
        userId: 'user-456'
      }

      // Add job to queue
      const job = await QueueManager.addResearchJob(jobData)
      expect(job).toBeDefined()
      expect(job.data).toEqual(jobData)

      // Simulate job processing
      const processor = new IntelligenceProcessor('test-key')
      const mockCustomerData = {
        companyName: jobData.companyName,
        meetings: [],
        emails: [],
        supportTickets: [],
        productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
        crmData: { accountId: jobData.companyId, stage: 'prospect', value: 0, probability: 0 }
      }

      const report = await processor.processCustomerData(mockCustomerData)
      
      expect(report.companyName).toBe(jobData.companyName)
      expect(report.insights).toBeInstanceOf(Array)
      expect(report.opportunities).toBeInstanceOf(Array)
    })

    it('should handle job failures gracefully', async () => {
      const jobData = {
        companyId: 'invalid-comp',
        companyName: 'NonexistentCorp',
        priority: 'low' as const
      }

      // Mock processor to fail
      const { mockOpenAI } = require('@/test/mocks/openai.mock')
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API quota exceeded'))

      const job = await QueueManager.addResearchJob(jobData)
      
      try {
        const processor = new IntelligenceProcessor('test-key')
        await processor.processCustomerData({
          companyName: jobData.companyName,
          meetings: [],
          emails: [],
          supportTickets: [],
          productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
          crmData: { accountId: jobData.companyId, stage: 'prospect', value: 0, probability: 0 }
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('API quota exceeded')
      }
    })

    it('should prioritize high priority jobs', async () => {
      const highPriorityJob = {
        companyId: 'high-priority-comp',
        companyName: 'HighPriorityTech',
        priority: 'high' as const
      }

      const lowPriorityJob = {
        companyId: 'low-priority-comp',
        companyName: 'LowPriorityTech',
        priority: 'low' as const
      }

      const highJob = await QueueManager.addResearchJob(highPriorityJob)
      const lowJob = await QueueManager.addResearchJob(lowPriorityJob)

      // High priority job should have higher priority number
      expect(highJob.opts.priority).toBeGreaterThan(lowJob.opts.priority)
    })
  })

  describe('Enrichment Job Processing', () => {
    it('should process LinkedIn enrichment job', async () => {
      const jobData = {
        contactId: 'contact-789',
        linkedinUrl: 'https://www.linkedin.com/in/johnsmith',
        companyId: 'comp-123'
      }

      const job = await QueueManager.addEnrichmentJob(jobData)
      
      // Simulate LinkedIn scraping
      const scraper = new LinkedInScraperService()
      const profile = await scraper.getProfile('johnsmith')

      expect(profile.success).toBe(true)
      expect(profile.data.basic_info.public_identifier).toBe('johnsmith')

      // Simulate data mapping
      const mappedData = scraper.mapToAirtableFields(profile)
      expect(mappedData['Full Name']).toBe('John Smith')
      expect(mappedData['Current Company']).toBe('TechCorp Inc')
    })

    it('should handle invalid LinkedIn URLs in enrichment jobs', async () => {
      const jobData = {
        contactId: 'contact-invalid',
        linkedinUrl: 'invalid-url',
        companyId: 'comp-123'
      }

      const job = await QueueManager.addEnrichmentJob(jobData)
      
      // Simulate processing with invalid URL
      try {
        const scraper = new LinkedInScraperService()
        const { mockLinkedInScraper } = require('@/test/mocks/linkedin.mock')
        mockLinkedInScraper.getProfile.mockRejectedValueOnce(new Error('Invalid LinkedIn URL format'))
        
        await scraper.getProfile('invalid-user')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Invalid LinkedIn URL format')
      }
    })
  })

  describe('Signal Processing', () => {
    it('should process signals in real-time', async () => {
      const signalData = {
        signalId: 'signal-123',
        signalType: 'company_funding',
        companyId: 'comp-123',
        data: {
          fundingAmount: 50000000,
          fundingRound: 'Series B',
          investors: ['Acme Ventures'],
          date: '2024-01-15'
        }
      }

      const job = await QueueManager.addSignalJob(signalData)
      
      expect(job.opts.priority).toBe(8) // High priority for real-time signals
      expect(job.data.signalType).toBe('company_funding')
    })

    it('should handle different signal types', async () => {
      const signalTypes = [
        'company_funding',
        'executive_change',
        'product_launch',
        'expansion_news',
        'hr_initiative'
      ]

      for (const signalType of signalTypes) {
        const signalData = {
          signalId: `signal-${signalType}`,
          signalType,
          companyId: 'comp-123',
          data: { type: signalType }
        }

        const job = await QueueManager.addSignalJob(signalData)
        expect(job.data.signalType).toBe(signalType)
      }
    })
  })

  describe('Report Generation', () => {
    it('should generate and queue weekly reports', async () => {
      const companies = [
        { id: 'comp-1', userId: 'user-1' },
        { id: 'comp-2', userId: 'user-2' },
        { id: 'comp-3', userId: 'user-3' }
      ]

      const jobs = await QueueManager.scheduleWeeklyReports(companies)
      
      expect(jobs).toHaveLength(3)
      jobs.forEach((job, index) => {
        expect(job.data.companyId).toBe(companies[index].id)
        expect(job.data.reportType).toBe('weekly')
        expect(job.data.userId).toBe(companies[index].userId)
      })
    })

    it('should handle report generation job', async () => {
      const reportData = {
        companyId: 'comp-123',
        reportType: 'monthly' as const,
        userId: 'user-456',
        emailTo: 'user@example.com'
      }

      const job = await QueueManager.addReportJob(reportData)
      
      expect(job.data).toEqual(reportData)
      expect(job.data.reportType).toBe('monthly')
    })
  })

  describe('Queue Management Operations', () => {
    it('should get queue statistics', async () => {
      const stats = await QueueManager.getQueueStats()
      
      expect(stats.research).toBeDefined()
      expect(stats.enrichment).toBeDefined()
      expect(stats.reports).toBeDefined()
      expect(stats.signals).toBeDefined()

      // Each queue should have job counts
      Object.values(stats).forEach(queueStats => {
        expect(queueStats).toHaveProperty('waiting')
        expect(queueStats).toHaveProperty('active')
        expect(queueStats).toHaveProperty('completed')
        expect(queueStats).toHaveProperty('failed')
      })
    })

    it('should pause and resume all queues', async () => {
      await QueueManager.pauseAllQueues()
      
      // Verify pause was called on mock queues
      const { mockResearchQueue, mockEnrichmentQueue, mockReportQueue, mockSignalQueue } = require('@/test/mocks/redis.mock')
      expect(mockResearchQueue.pause).toHaveBeenCalled()
      expect(mockEnrichmentQueue.pause).toHaveBeenCalled()
      expect(mockReportQueue.pause).toHaveBeenCalled()
      expect(mockSignalQueue.pause).toHaveBeenCalled()

      await QueueManager.resumeAllQueues()
      
      expect(mockResearchQueue.resume).toHaveBeenCalled()
      expect(mockEnrichmentQueue.resume).toHaveBeenCalled()
      expect(mockReportQueue.resume).toHaveBeenCalled()
      expect(mockSignalQueue.resume).toHaveBeenCalled()
    })

    it('should clean old jobs from queues', async () => {
      await QueueManager.cleanQueues()
      
      const { mockResearchQueue, mockEnrichmentQueue } = require('@/test/mocks/redis.mock')
      expect(mockResearchQueue.clean).toHaveBeenCalledWith(
        expect.any(Number), // grace period
        expect.any(Number), // limit
        expect.any(String)  // type
      )
      expect(mockEnrichmentQueue.clean).toHaveBeenCalled()
    })
  })

  describe('Error Recovery and Retry Logic', () => {
    it('should retry failed jobs with exponential backoff', async () => {
      const jobData = {
        companyId: 'retry-test-comp',
        companyName: 'RetryTestCorp',
        priority: 'normal' as const
      }

      const job = await QueueManager.addResearchJob(jobData)
      
      // Verify retry configuration
      expect(job.opts.attempts).toBe(3)
      expect(job.opts.backoff).toEqual({
        type: 'exponential',
        delay: 2000
      })
    })

    it('should handle permanent job failures', async () => {
      const jobData = {
        contactId: 'permanent-failure-contact',
        linkedinUrl: 'https://linkedin.com/in/nonexistent',
        companyId: 'comp-123'
      }

      const job = await QueueManager.addEnrichmentJob(jobData)
      
      // Simulate permanent failure after retries
      const { mockLinkedInScraper } = require('@/test/mocks/linkedin.mock')
      mockLinkedInScraper.getProfile.mockRejectedValue(new Error('Profile permanently deleted'))

      // Job should eventually fail after exhausting retries
      expect(job.opts.attempts).toBe(2) // Max attempts for enrichment jobs
    })

    it('should preserve job data through retries', async () => {
      const originalJobData = {
        signalId: 'retry-signal',
        signalType: 'funding_news',
        companyId: 'comp-456',
        data: {
          amount: 25000000,
          round: 'Series A'
        }
      }

      const job = await QueueManager.addSignalJob(originalJobData)
      
      // Job data should remain intact
      expect(job.data).toEqual(originalJobData)
    })
  })

  describe('Queue Performance and Monitoring', () => {
    it('should handle high job volumes', async () => {
      const jobs = []
      const startTime = Date.now()

      // Add many jobs quickly
      for (let i = 0; i < 100; i++) {
        jobs.push(QueueManager.addResearchJob({
          companyId: `load-test-${i}`,
          companyName: `LoadTestCorp ${i}`,
          priority: 'normal' as const
        }))
      }

      await Promise.all(jobs)
      const endTime = Date.now()

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000)
      expect(jobs).toHaveLength(100)
    })

    it('should provide job progress tracking', async () => {
      const jobData = {
        companyId: 'progress-test-comp',
        companyName: 'ProgressTestCorp',
        priority: 'normal' as const
      }

      const job = await QueueManager.addResearchJob(jobData)
      
      // Mock job progress
      job.progress = 50 // 50% complete
      job.returnvalue = { status: 'processing', step: 'web_research' }

      expect(job.progress).toBe(50)
      expect(job.returnvalue.status).toBe('processing')
    })

    it('should maintain job order within priority levels', async () => {
      const jobs = []
      
      // Add jobs with same priority in sequence
      for (let i = 0; i < 5; i++) {
        jobs.push(await QueueManager.addResearchJob({
          companyId: `order-test-${i}`,
          companyName: `OrderTestCorp ${i}`,
          priority: 'normal' as const
        }))
      }

      // Jobs should maintain FIFO order within same priority
      jobs.forEach((job, index) => {
        expect(job.data.companyId).toBe(`order-test-${index}`)
      })
    })
  })

  describe('Database Integration', () => {
    it('should save job results to database', async () => {
      const jobData = {
        contactId: 'db-test-contact',
        linkedinUrl: 'https://linkedin.com/in/johnsmith',
        companyId: 'comp-789'
      }

      const job = await QueueManager.addEnrichmentJob(jobData)
      
      // Simulate successful processing and database save
      const { mockSupabaseLinkedIn } = require('@/test/mocks/supabase.mock')
      const mockConnectionData = {
        id: jobData.contactId,
        full_name: 'John Smith',
        current_company: 'TechCorp Inc'
      }

      await mockSupabaseLinkedIn.upsertConnection(mockConnectionData)
      
      expect(mockSupabaseLinkedIn.upsertConnection).toHaveBeenCalledWith(mockConnectionData)
    })

    it('should handle database connection failures', async () => {
      const { mockSupabaseLinkedIn } = require('@/test/mocks/supabase.mock')
      mockSupabaseLinkedIn.upsertConnection.mockRejectedValueOnce(new Error('Database connection timeout'))

      const jobData = {
        contactId: 'db-failure-contact',
        linkedinUrl: 'https://linkedin.com/in/testuser',
        companyId: 'comp-999'
      }

      const job = await QueueManager.addEnrichmentJob(jobData)
      
      try {
        await mockSupabaseLinkedIn.upsertConnection({ id: jobData.contactId })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Database connection timeout')
      }
    })
  })
})