import { NextRequest, NextResponse } from 'next/server';
import { researchQueue, enrichmentQueue, reportQueue, signalQueue } from '@/lib/queue';

const queueMap = {
  research: researchQueue,
  enrichment: enrichmentQueue,
  reports: reportQueue,
  signals: signalQueue,
};

// GET /api/queues/[queueName] - Get detailed queue information
export async function GET(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  try {
    const { queueName } = params;
    const { searchParams } = new URL(request.url);
    const includeJobs = searchParams.get('includeJobs') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // waiting, active, completed, failed, delayed
    
    if (!queueMap[queueName as keyof typeof queueMap]) {
      return NextResponse.json(
        { error: `Invalid queue name: ${queueName}` },
        { status: 404 }
      );
    }
    
    const queue = queueMap[queueName as keyof typeof queueMap];
    
    // Get queue statistics
    const stats = await queue.getJobCounts();
    
    // Get queue info
    const queueInfo = {
      name: queueName,
      stats,
      isPaused: await queue.isPaused(),
      timestamp: new Date().toISOString(),
    };
    
    if (!includeJobs) {
      return NextResponse.json(queueInfo);
    }
    
    // Get jobs based on status
    let jobs: any[] = [];
    
    if (status) {
      switch (status) {
        case 'waiting':
          jobs = await queue.getJobs(['waiting'], 0, limit - 1);
          break;
        case 'active':
          jobs = await queue.getJobs(['active'], 0, limit - 1);
          break;
        case 'completed':
          jobs = await queue.getJobs(['completed'], 0, limit - 1);
          break;
        case 'failed':
          jobs = await queue.getJobs(['failed'], 0, limit - 1);
          break;
        case 'delayed':
          jobs = await queue.getJobs(['delayed'], 0, limit - 1);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid status. Must be one of: waiting, active, completed, failed, delayed' },
            { status: 400 }
          );
      }
    } else {
      // Get mixed job types
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getJobs(['waiting'], 0, Math.ceil(limit / 5) - 1),
        queue.getJobs(['active'], 0, Math.ceil(limit / 5) - 1),
        queue.getJobs(['completed'], 0, Math.ceil(limit / 5) - 1),
        queue.getJobs(['failed'], 0, Math.ceil(limit / 5) - 1),
        queue.getJobs(['delayed'], 0, Math.ceil(limit / 5) - 1),
      ]);
      
      jobs = [...waiting, ...active, ...completed, ...failed, ...delayed].slice(0, limit);
    }
    
    // Format job data
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress || 0,
      status: job.finishedOn ? (job.failedReason ? 'failed' : 'completed') :
              job.processedOn ? 'active' :
              job.opts.delay && job.opts.delay > 0 ? 'delayed' : 'waiting',
      createdAt: new Date(job.timestamp).toISOString(),
      processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      attemptsMade: job.attemptsMade || 0,
      attemptsLeft: (job.opts.attempts || 1) - (job.attemptsMade || 0),
      priority: job.opts.priority || 0,
      delay: job.opts.delay || 0,
      failedReason: job.failedReason || null,
      duration: job.processedOn && job.finishedOn ? job.finishedOn - job.processedOn : null,
    }));
    
    return NextResponse.json({
      ...queueInfo,
      jobs: formattedJobs,
      jobCount: formattedJobs.length,
      totalJobsRequested: limit,
    });
    
  } catch (error) {
    console.error('Error fetching queue details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue details', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/queues/[queueName] - Queue management actions
export async function POST(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  try {
    const { queueName } = params;
    const { action, options = {} } = await request.json();
    
    if (!queueMap[queueName as keyof typeof queueMap]) {
      return NextResponse.json(
        { error: `Invalid queue name: ${queueName}` },
        { status: 404 }
      );
    }
    
    const queue = queueMap[queueName as keyof typeof queueMap];
    let result: any = { success: true };
    
    switch (action) {
      case 'pause':
        await queue.pause();
        result.message = `Queue ${queueName} paused`;
        break;
        
      case 'resume':
        await queue.resume();
        result.message = `Queue ${queueName} resumed`;
        break;
        
      case 'clean':
        const {
          grace = 24 * 60 * 60 * 1000, // 24 hours
          limit = 100,
          type = 'completed'
        } = options;
        
        if (!['completed', 'failed', 'active', 'waiting', 'delayed'].includes(type)) {
          return NextResponse.json(
            { error: 'Invalid clean type. Must be one of: completed, failed, active, waiting, delayed' },
            { status: 400 }
          );
        }
        
        const cleanedJobs = await queue.clean(grace, limit, type);
        result.message = `Cleaned ${cleanedJobs.length} ${type} jobs from ${queueName} queue`;
        result.cleanedJobIds = cleanedJobs;
        break;
        
      case 'drain':
        await queue.drain();
        result.message = `All waiting jobs removed from ${queueName} queue`;
        break;
        
      case 'obliterate':
        await queue.obliterate();
        result.message = `Queue ${queueName} obliterated (all jobs and data removed)`;
        break;
        
      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be one of: pause, resume, clean, drain, obliterate` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error managing queue:', error);
    return NextResponse.json(
      { error: 'Failed to manage queue', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/queues/[queueName] - Bulk job removal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { queueName: string } }
) {
  try {
    const { queueName } = params;
    const { searchParams } = new URL(request.url);
    const jobIds = searchParams.get('jobIds')?.split(',') || [];
    const status = searchParams.get('status'); // Remove all jobs with this status
    
    if (!queueMap[queueName as keyof typeof queueMap]) {
      return NextResponse.json(
        { error: `Invalid queue name: ${queueName}` },
        { status: 404 }
      );
    }
    
    const queue = queueMap[queueName as keyof typeof queueMap];
    let removedCount = 0;
    
    if (jobIds.length > 0) {
      // Remove specific jobs
      const results = await Promise.allSettled(
        jobIds.map(async (jobId) => {
          const job = await queue.getJob(jobId);
          if (job) {
            await job.remove();
            return jobId;
          }
          return null;
        })
      );
      
      removedCount = results.filter(result => 
        result.status === 'fulfilled' && result.value !== null
      ).length;
      
      return NextResponse.json({
        success: true,
        message: `Removed ${removedCount} jobs from ${queueName} queue`,
        removedCount,
        requestedCount: jobIds.length,
      });
    }
    
    if (status) {
      // Remove all jobs with specific status
      let jobs: any[] = [];
      
      switch (status) {
        case 'waiting':
        case 'active':
        case 'completed':
        case 'failed':
        case 'delayed':
          jobs = await queue.getJobs([status]);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid status for bulk removal' },
            { status: 400 }
          );
      }
      
      const removePromises = jobs.map(job => job.remove());
      await Promise.allSettled(removePromises);
      removedCount = jobs.length;
      
      return NextResponse.json({
        success: true,
        message: `Removed ${removedCount} ${status} jobs from ${queueName} queue`,
        removedCount,
      });
    }
    
    return NextResponse.json(
      { error: 'Must specify either jobIds or status for bulk removal' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error removing jobs:', error);
    return NextResponse.json(
      { error: 'Failed to remove jobs', details: (error as Error).message },
      { status: 500 }
    );
  }
}