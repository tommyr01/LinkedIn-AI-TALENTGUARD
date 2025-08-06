import { NextRequest, NextResponse } from 'next/server';
import { researchQueue, enrichmentQueue, reportQueue, signalQueue } from '@/lib/queue';

// GET /api/jobs/[jobId] - Get specific job status
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    // Search for job across all queues
    const queues = [
      { name: 'research', queue: researchQueue },
      { name: 'enrichment', queue: enrichmentQueue },
      { name: 'reports', queue: reportQueue },
      { name: 'signals', queue: signalQueue },
    ];
    
    let job = null;
    let queueName = '';
    
    for (const { name, queue } of queues) {
      try {
        job = await queue.getJob(jobId);
        if (job) {
          queueName = name;
          break;
        }
      } catch (error) {
        // Job not found in this queue, continue searching
        console.log(`Job ${jobId} not found in ${name} queue`);
      }
    }
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get job details
    const jobData = {
      id: job.id,
      name: job.name,
      queue: queueName,
      data: job.data,
      opts: job.opts,
      progress: job.progress || 0,
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      timestamp: new Date(job.timestamp).toISOString(),
      attemptsMade: job.attemptsMade || 0,
      attemptsLeft: (job.opts.attempts || 1) - (job.attemptsMade || 0),
      failedReason: job.failedReason || null,
      returnvalue: job.returnvalue || null,
      stacktrace: job.stacktrace || null,
    };
    
    // Determine job status
    let status = 'unknown';
    if (job.finishedOn) {
      status = job.failedReason ? 'failed' : 'completed';
    } else if (job.processedOn) {
      status = 'active';
    } else {
      status = job.opts.delay && job.opts.delay > 0 ? 'delayed' : 'waiting';
    }
    
    return NextResponse.json({
      ...jobData,
      status,
      duration: job.processedOn && job.finishedOn ? 
        job.finishedOn - job.processedOn : null,
      timeInQueue: job.processedOn ? 
        job.processedOn - job.timestamp : 
        Date.now() - job.timestamp,
    });
    
  } catch (error) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job details', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[jobId] - Cancel or remove job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'remove'; // 'remove' or 'retry'
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    // Search for job across all queues
    const queues = [
      { name: 'research', queue: researchQueue },
      { name: 'enrichment', queue: enrichmentQueue },
      { name: 'reports', queue: reportQueue },
      { name: 'signals', queue: signalQueue },
    ];
    
    let job = null;
    let queueName = '';
    
    for (const { name, queue } of queues) {
      try {
        job = await queue.getJob(jobId);
        if (job) {
          queueName = name;
          break;
        }
      } catch (error) {
        console.log(`Job ${jobId} not found in ${name} queue`);
      }
    }
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    switch (action) {
      case 'remove':
        await job.remove();
        return NextResponse.json({
          success: true,
          message: `Job ${jobId} removed from ${queueName} queue`
        });
        
      case 'retry':
        if (!job.failedReason) {
          return NextResponse.json(
            { error: 'Job has not failed, cannot retry' },
            { status: 400 }
          );
        }
        await job.retry();
        return NextResponse.json({
          success: true,
          message: `Job ${jobId} queued for retry in ${queueName} queue`
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be one of: remove, retry' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error managing job:', error);
    return NextResponse.json(
      { error: 'Failed to manage job', details: (error as Error).message },
      { status: 500 }
    );
  }
}