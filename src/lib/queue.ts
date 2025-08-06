import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection configuration
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: true,
});

// Job types and data interfaces
export interface ResearchJobData {
  companyId: string;
  companyName: string;
  domain?: string;
  priority?: 'low' | 'normal' | 'high';
  userId?: string;
}

export interface EnrichmentJobData {
  contactId: string;
  linkedinUrl?: string;
  email?: string;
  companyId: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface ReportJobData {
  companyId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly';
  userId: string;
  emailTo?: string;
}

export interface SignalProcessingJobData {
  signalId: string;
  signalType: string;
  companyId: string;
  data: any;
}

// Define job queues
export const researchQueue = new Queue<ResearchJobData>('research', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const enrichmentQueue = new Queue<EnrichmentJobData>('enrichment', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

export const reportQueue = new Queue<ReportJobData>('reports', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 2,
    delay: 1000,
  },
});

export const signalQueue = new Queue<SignalProcessingJobData>('signals', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 100,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Queue management utilities
export class QueueManager {
  static async addResearchJob(data: ResearchJobData, options?: { priority?: number; delay?: number }) {
    const job = await researchQueue.add(
      'company-research',
      data,
      {
        priority: options?.priority || (data.priority === 'high' ? 10 : data.priority === 'low' ? 1 : 5),
        delay: options?.delay,
      }
    );
    
    console.log(`Added research job ${job.id} for company ${data.companyName}`);
    return job;
  }

  static async addEnrichmentJob(data: EnrichmentJobData, options?: { priority?: number; delay?: number }) {
    const job = await enrichmentQueue.add(
      'contact-enrichment',
      data,
      {
        priority: options?.priority || (data.priority === 'high' ? 10 : data.priority === 'low' ? 1 : 5),
        delay: options?.delay,
      }
    );
    
    console.log(`Added enrichment job ${job.id} for contact ${data.contactId}`);
    return job;
  }

  static async addReportJob(data: ReportJobData, options?: { priority?: number; delay?: number }) {
    const job = await reportQueue.add(
      'generate-report',
      data,
      {
        priority: options?.priority || 5,
        delay: options?.delay,
      }
    );
    
    console.log(`Added report job ${job.id} for company ${data.companyId}`);
    return job;
  }

  static async addSignalJob(data: SignalProcessingJobData, options?: { priority?: number }) {
    const job = await signalQueue.add(
      'process-signal',
      data,
      {
        priority: options?.priority || 8, // High priority for real-time signals
      }
    );
    
    console.log(`Added signal processing job ${job.id} for signal ${data.signalId}`);
    return job;
  }

  // Schedule recurring jobs
  static async scheduleWeeklyReports(companies: { id: string; userId: string }[]) {
    const jobs = companies.map(company =>
      reportQueue.add(
        'weekly-report',
        {
          companyId: company.id,
          reportType: 'weekly' as const,
          userId: company.userId,
        },
        {
          repeat: { pattern: '0 9 * * MON' }, // Every Monday at 9 AM
          jobId: `weekly-${company.id}`, // Prevent duplicates
        }
      )
    );

    return Promise.all(jobs);
  }

  // Queue status and monitoring
  static async getQueueStats() {
    const [
      researchStats,
      enrichmentStats,
      reportStats,
      signalStats
    ] = await Promise.all([
      researchQueue.getJobCounts(),
      enrichmentQueue.getJobCounts(),
      reportQueue.getJobCounts(),
      signalQueue.getJobCounts(),
    ]);

    return {
      research: researchStats,
      enrichment: enrichmentStats,
      reports: reportStats,
      signals: signalStats,
    };
  }

  static async pauseAllQueues() {
    await Promise.all([
      researchQueue.pause(),
      enrichmentQueue.pause(),
      reportQueue.pause(),
      signalQueue.pause(),
    ]);
  }

  static async resumeAllQueues() {
    await Promise.all([
      researchQueue.resume(),
      enrichmentQueue.resume(),
      reportQueue.resume(),
      signalQueue.resume(),
    ]);
  }

  // Clean up completed/failed jobs
  static async cleanQueues() {
    await Promise.all([
      researchQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'), // Clean completed jobs older than 24h
      researchQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed'), // Clean failed jobs older than 7 days
      enrichmentQueue.clean(24 * 60 * 60 * 1000, 50, 'completed'),
      enrichmentQueue.clean(7 * 24 * 60 * 60 * 1000, 25, 'failed'),
      reportQueue.clean(7 * 24 * 60 * 60 * 1000, 20, 'completed'),
      reportQueue.clean(30 * 24 * 60 * 60 * 1000, 10, 'failed'),
      signalQueue.clean(12 * 60 * 60 * 1000, 200, 'completed'), // Signals cleaned more frequently
      signalQueue.clean(3 * 24 * 60 * 60 * 1000, 100, 'failed'),
    ]);

    console.log('Queue cleanup completed');
  }
}

// Export Redis connection for workers
export { redisConnection };

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down queues...');
  await Promise.all([
    researchQueue.close(),
    enrichmentQueue.close(),
    reportQueue.close(),
    signalQueue.close(),
  ]);
  await redisConnection.quit();
  process.exit(0);
});