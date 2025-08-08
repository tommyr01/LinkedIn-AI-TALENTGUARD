/**
 * Mock Redis and BullMQ services for testing
 * Provides predictable queue operations
 */

export interface MockJob {
  id: string
  name: string
  data: any
  opts: any
  progress: number
  returnvalue: any
  attemptsMade: number
  processedOn?: number
  finishedOn?: number
  failedReason?: string
}

export const createMockRedis = () => ({
  get: jest.fn().mockImplementation((key: string) => {
    // Return different values based on key patterns
    if (key.includes('job:')) return JSON.stringify({ status: 'completed' })
    if (key.includes('queue:')) return '10' // queue length
    return null
  }),
  
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1),
  decr: jest.fn().mockResolvedValue(1),
  
  // Hash operations
  hget: jest.fn().mockResolvedValue('value'),
  hset: jest.fn().mockResolvedValue(1),
  hdel: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn().mockResolvedValue({}),
  
  // List operations
  lpush: jest.fn().mockResolvedValue(1),
  rpush: jest.fn().mockResolvedValue(1),
  lpop: jest.fn().mockResolvedValue('item'),
  rpop: jest.fn().mockResolvedValue('item'),
  llen: jest.fn().mockResolvedValue(0),
  
  // Set operations
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  
  // Connection management
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue('OK'),
  
  // Status
  status: 'ready'
})

export const createMockQueue = (name: string) => {
  const jobs = new Map<string, MockJob>()
  let jobIdCounter = 1000
  
  return {
    name,
    
    add: jest.fn().mockImplementation(async (jobName: string, data: any, opts: any = {}) => {
      const jobId = `${jobIdCounter++}`
      const job: MockJob = {
        id: jobId,
        name: jobName,
        data,
        opts,
        progress: 0,
        returnvalue: null,
        attemptsMade: 0
      }
      jobs.set(jobId, job)
      return job
    }),
    
    getJob: jest.fn().mockImplementation(async (jobId: string) => {
      return jobs.get(jobId) || null
    }),
    
    getJobs: jest.fn().mockImplementation(async (types: string[] = ['waiting', 'active', 'completed', 'failed']) => {
      return Array.from(jobs.values()).filter(job => {
        // Simple status simulation based on progress
        if (job.progress === 100) return types.includes('completed')
        if (job.progress > 0) return types.includes('active')
        if (job.failedReason) return types.includes('failed')
        return types.includes('waiting')
      })
    }),
    
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 5,
      active: 2,
      completed: 100,
      failed: 3,
      delayed: 1
    }),
    
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    
    clean: jest.fn().mockImplementation(async (grace: number, limit: number, type: string) => {
      // Simulate cleaning by removing some jobs
      const jobsArray = Array.from(jobs.values())
      const toRemove = jobsArray.slice(0, Math.min(limit, 10))
      toRemove.forEach(job => jobs.delete(job.id))
      return toRemove
    }),
    
    close: jest.fn().mockResolvedValue(undefined),
    
    // Events (simplified)
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }
}

export const createMockWorker = (queueName: string) => ({
  name: queueName,
  
  // Process function would be set by the actual worker
  process: jest.fn(),
  
  // Events
  on: jest.fn(),
  off: jest.fn(),
  
  // Control
  close: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined)
})

// Mock queue instances for each queue type
export const mockResearchQueue = createMockQueue('research')
export const mockEnrichmentQueue = createMockQueue('enrichment')  
export const mockReportQueue = createMockQueue('reports')
export const mockSignalQueue = createMockQueue('signals')

// Mock QueueManager class
export const createMockQueueManager = () => ({
  addResearchJob: jest.fn().mockImplementation(async (data: any) => {
    return mockResearchQueue.add('company-research', data)
  }),
  
  addEnrichmentJob: jest.fn().mockImplementation(async (data: any) => {
    return mockEnrichmentQueue.add('contact-enrichment', data)
  }),
  
  addReportJob: jest.fn().mockImplementation(async (data: any) => {
    return mockReportQueue.add('generate-report', data)
  }),
  
  addSignalJob: jest.fn().mockImplementation(async (data: any) => {
    return mockSignalQueue.add('process-signal', data)
  }),
  
  scheduleWeeklyReports: jest.fn().mockResolvedValue([]),
  
  getQueueStats: jest.fn().mockResolvedValue({
    research: { waiting: 5, active: 2, completed: 100, failed: 3 },
    enrichment: { waiting: 3, active: 1, completed: 50, failed: 1 },
    reports: { waiting: 1, active: 0, completed: 20, failed: 0 },
    signals: { waiting: 10, active: 5, completed: 200, failed: 5 }
  }),
  
  pauseAllQueues: jest.fn().mockResolvedValue(undefined),
  resumeAllQueues: jest.fn().mockResolvedValue(undefined),
  cleanQueues: jest.fn().mockResolvedValue(undefined)
})

// Jest mocks for Redis and queue modules
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => createMockRedis())
})

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => createMockQueue(name)),
  Worker: jest.fn().mockImplementation((name: string) => createMockWorker(name)),
  Job: jest.fn()
}))

jest.mock('@/lib/queue', () => ({
  researchQueue: mockResearchQueue,
  enrichmentQueue: mockEnrichmentQueue,
  reportQueue: mockReportQueue,
  signalQueue: mockSignalQueue,
  QueueManager: createMockQueueManager(),
  redisConnection: createMockRedis()
}))

export const mockRedis = createMockRedis()
export const mockQueueManager = createMockQueueManager()