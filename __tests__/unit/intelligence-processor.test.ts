/**
 * Unit Tests for Intelligence Processor
 * Tests core AI intelligence processing logic
 */

import { IntelligenceProcessor, CustomerData, Insight, Opportunity } from '@/lib/intelligence-processor'
import '@/test/mocks/openai.mock'

describe('IntelligenceProcessor', () => {
  let processor: IntelligenceProcessor

  beforeEach(() => {
    processor = new IntelligenceProcessor('test-api-key')
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with API key', () => {
      expect(processor).toBeInstanceOf(IntelligenceProcessor)
    })

    it('should throw error without API key', () => {
      expect(() => new IntelligenceProcessor('')).toThrow()
    })
  })

  describe('processCustomerData', () => {
    const mockCustomerData: CustomerData = {
      companyName: 'TechCorp Inc',
      meetings: [{
        date: '2024-01-15',
        participants: [{
          name: 'Sarah Johnson',
          title: 'VP of People',
          email: 'sarah@techcorp.com',
          role: 'decision_maker'
        }],
        transcript: 'We are struggling with performance review consistency across our teams. Our current process is very manual and time-consuming.',
        duration: 30,
        topics: ['performance reviews', 'HR processes']
      }],
      emails: [],
      supportTickets: [],
      productUsage: {
        totalSessions: 45,
        avgSessionDuration: 15,
        featuresUsed: ['reports', 'analytics'],
        lastActivity: '2024-01-20'
      },
      crmData: {
        accountId: 'acc-123',
        stage: 'qualification',
        value: 50000,
        probability: 60
      }
    }

    it('should process customer data successfully', async () => {
      const report = await processor.processCustomerData(mockCustomerData)

      expect(report).toBeDefined()
      expect(report.companyName).toBe('TechCorp Inc')
      expect(report.insights).toBeInstanceOf(Array)
      expect(report.opportunities).toBeInstanceOf(Array)
      expect(report.stakeholderMap).toBeDefined()
      expect(report.salesStrategy).toBeDefined()
      expect(report.outreach).toBeDefined()
      expect(report.appendix).toBeDefined()
    })

    it('should extract insights from meetings', async () => {
      const report = await processor.processCustomerData(mockCustomerData)

      expect(report.insights.length).toBeGreaterThan(0)
      expect(report.insights[0]).toHaveProperty('type')
      expect(report.insights[0]).toHaveProperty('description')
      expect(report.insights[0]).toHaveProperty('priority')
      expect(report.insights[0]).toHaveProperty('source')
    })

    it('should identify opportunities', async () => {
      const report = await processor.processCustomerData(mockCustomerData)

      expect(report.opportunities.length).toBeGreaterThan(0)
      expect(report.opportunities[0]).toHaveProperty('title')
      expect(report.opportunities[0]).toHaveProperty('need')
      expect(report.opportunities[0]).toHaveProperty('validation')
      expect(['strong', 'medium', 'weak']).toContain(report.opportunities[0].validation)
    })

    it('should map stakeholders correctly', async () => {
      const report = await processor.processCustomerData(mockCustomerData)

      expect(report.stakeholderMap.decisionMakers).toBeInstanceOf(Array)
      expect(report.stakeholderMap.champions).toBeInstanceOf(Array)
      expect(report.stakeholderMap.influencers).toBeInstanceOf(Array)
      expect(report.stakeholderMap.endUsers).toBeInstanceOf(Array)
      expect(report.stakeholderMap.blockers).toBeInstanceOf(Array)
    })

    it('should handle empty input data', async () => {
      const emptyData: CustomerData = {
        companyName: 'EmptyCompany',
        meetings: [],
        emails: [],
        supportTickets: [],
        productUsage: {
          totalSessions: 0,
          avgSessionDuration: 0,
          featuresUsed: [],
          lastActivity: ''
        },
        crmData: {
          accountId: 'empty-123',
          stage: 'prospect',
          value: 0,
          probability: 0
        }
      }

      const report = await processor.processCustomerData(emptyData)

      expect(report.companyName).toBe('EmptyCompany')
      expect(report.insights).toBeInstanceOf(Array)
      expect(report.opportunities).toBeInstanceOf(Array)
    })
  })

  describe('extractInsights', () => {
    it('should extract insights from meeting transcript', async () => {
      const mockData: CustomerData = {
        companyName: 'TestCorp',
        meetings: [{
          date: '2024-01-15',
          participants: [{ name: 'John Doe', title: 'HR Director', email: 'john@test.com' }],
          transcript: 'Our biggest challenge is managing employee performance reviews across multiple departments. The current system lacks consistency.',
          duration: 45,
          topics: ['performance management']
        }],
        emails: [],
        supportTickets: [],
        productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
        crmData: { accountId: '', stage: 'prospect', value: 0, probability: 0 }
      }

      const report = await processor.processCustomerData(mockData)
      const insights = report.insights

      expect(insights.length).toBeGreaterThan(0)
      expect(insights.some(insight => 
        insight.type === 'pain_point' && 
        insight.description.toLowerCase().includes('performance')
      )).toBe(true)
    })

    it('should prioritize insights correctly', async () => {
      const report = await processor.processCustomerData({
        companyName: 'TestCorp',
        meetings: [{
          date: '2024-01-15',
          participants: [{ name: 'Jane Smith', title: 'CHRO', email: 'jane@test.com', role: 'decision_maker' }],
          transcript: 'This is a critical issue affecting our entire organization. We need immediate solutions.',
          duration: 30,
          topics: ['urgent issues']
        }],
        emails: [],
        supportTickets: [],
        productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
        crmData: { accountId: '', stage: 'prospect', value: 0, probability: 0 }
      })

      const highPriorityInsights = report.insights.filter(insight => insight.priority === 'high')
      expect(highPriorityInsights.length).toBeGreaterThan(0)
    })
  })

  describe('identifyOpportunities', () => {
    it('should create opportunities from insights', async () => {
      const mockInsights: Insight[] = [
        {
          type: 'pain_point',
          description: 'Inconsistent performance review process',
          priority: 'high',
          source: 'Meeting with CHRO',
          date: '2024-01-15',
          quotes: ['Reviews are all over the place']
        },
        {
          type: 'feature_request',
          description: 'Need better reporting capabilities',
          priority: 'medium',
          source: 'Support ticket',
          date: '2024-01-16',
          quotes: ['Can we get better dashboards?']
        }
      ]

      const opportunities = await processor['identifyOpportunities'](mockInsights, {
        companyName: 'TestCorp',
        meetings: [],
        emails: [],
        supportTickets: [],
        productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
        crmData: { accountId: '', stage: 'prospect', value: 0, probability: 0 }
      })

      expect(opportunities).toBeInstanceOf(Array)
      expect(opportunities.length).toBeGreaterThan(0)
      expect(opportunities[0]).toHaveProperty('title')
      expect(opportunities[0]).toHaveProperty('validation')
    })

    it('should sort opportunities by validation strength', async () => {
      const mockInsights: Insight[] = [
        { type: 'pain_point', description: 'Minor issue', priority: 'low', source: 'email', date: '2024-01-15', quotes: [] },
        { type: 'pain_point', description: 'Critical problem', priority: 'high', source: 'meeting', date: '2024-01-15', quotes: [] },
        { type: 'pain_point', description: 'Critical problem 2', priority: 'high', source: 'meeting', date: '2024-01-15', quotes: [] },
        { type: 'pain_point', description: 'Critical problem 3', priority: 'high', source: 'meeting', date: '2024-01-15', quotes: [] }
      ]

      const opportunities = await processor['identifyOpportunities'](mockInsights, {
        companyName: 'TestCorp',
        meetings: [],
        emails: [],
        supportTickets: [],
        productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
        crmData: { accountId: '', stage: 'prospect', value: 0, probability: 0 }
      })

      // Should be sorted by validation strength (strong first)
      for (let i = 0; i < opportunities.length - 1; i++) {
        const current = opportunities[i]
        const next = opportunities[i + 1]
        const validationOrder = { strong: 3, medium: 2, weak: 1 }
        expect(validationOrder[current.validation]).toBeGreaterThanOrEqual(validationOrder[next.validation])
      }
    })
  })

  describe('Helper Methods', () => {
    it('should categorize themes correctly', () => {
      const reportingInsight: Insight = {
        type: 'pain_point',
        description: 'Need better dashboard reports for executives',
        priority: 'high',
        source: 'meeting',
        date: '2024-01-15',
        quotes: []
      }

      const theme = processor['categorizeTheme'](reportingInsight)
      expect(theme).toBe('reporting')
    })

    it('should calculate validation strength', () => {
      const strongInsights: Insight[] = [
        { type: 'pain_point', description: 'Issue 1', priority: 'high', source: 'meeting', date: '2024-01-15', quotes: [] },
        { type: 'pain_point', description: 'Issue 2', priority: 'high', source: 'meeting', date: '2024-01-15', quotes: [] },
        { type: 'pain_point', description: 'Issue 3', priority: 'high', source: 'meeting', date: '2024-01-15', quotes: [] }
      ]

      const validation = processor['calculateValidation'](strongInsights)
      expect(validation).toBe('strong')

      const weakInsights: Insight[] = [
        { type: 'pain_point', description: 'Minor issue', priority: 'low', source: 'email', date: '2024-01-15', quotes: [] }
      ]

      const weakValidation = processor['calculateValidation'](weakInsights)
      expect(weakValidation).toBe('weak')
    })

    it('should group insights by theme', () => {
      const insights: Insight[] = [
        { type: 'pain_point', description: 'reporting dashboard issues', priority: 'high', source: 'meeting', date: '2024-01-15', quotes: [] },
        { type: 'pain_point', description: 'UI is confusing for users', priority: 'medium', source: 'support', date: '2024-01-15', quotes: [] },
        { type: 'pain_point', description: 'need better metrics reporting', priority: 'high', source: 'email', date: '2024-01-15', quotes: [] }
      ]

      const groups = processor['groupInsightsByTheme'](insights)
      
      expect(groups.reporting).toBeDefined()
      expect(groups.user_experience).toBeDefined()
      expect(groups.reporting.length).toBe(2)
      expect(groups.user_experience.length).toBe(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI error
      const { mockOpenAI } = require('@/test/mocks/openai.mock')
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API rate limit exceeded'))

      const mockData: CustomerData = {
        companyName: 'ErrorTestCorp',
        meetings: [{ 
          date: '2024-01-15', 
          participants: [{ name: 'Test User', title: 'Manager', email: 'test@test.com' }], 
          transcript: 'Test transcript', 
          duration: 30, 
          topics: [] 
        }],
        emails: [],
        supportTickets: [],
        productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
        crmData: { accountId: '', stage: 'prospect', value: 0, probability: 0 }
      }

      await expect(processor.processCustomerData(mockData)).rejects.toThrow('API rate limit exceeded')
    })

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      const { mockOpenAI } = require('@/test/mocks/openai.mock')
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: 'invalid json response' } }]
      })

      const mockData: CustomerData = {
        companyName: 'MalformedTestCorp',
        meetings: [{ 
          date: '2024-01-15', 
          participants: [{ name: 'Test User', title: 'Manager', email: 'test@test.com' }], 
          transcript: 'Test transcript', 
          duration: 30, 
          topics: [] 
        }],
        emails: [],
        supportTickets: [],
        productUsage: { totalSessions: 0, avgSessionDuration: 0, featuresUsed: [], lastActivity: '' },
        crmData: { accountId: '', stage: 'prospect', value: 0, probability: 0 }
      }

      // Should handle parsing error gracefully
      const report = await processor.processCustomerData(mockData)
      expect(report).toBeDefined()
      expect(report.companyName).toBe('MalformedTestCorp')
    })
  })
})