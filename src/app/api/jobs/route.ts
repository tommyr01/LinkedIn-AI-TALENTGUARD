import { NextRequest, NextResponse } from 'next/server';
import { QueueManager } from '@/lib/queue';

// GET /api/jobs - Get queue statistics and job status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queue = searchParams.get('queue'); // Optional: filter by specific queue
    const status = searchParams.get('status'); // Optional: filter by job status
    
    if (queue && !['research', 'enrichment', 'reports', 'signals'].includes(queue)) {
      return NextResponse.json(
        { error: 'Invalid queue name. Must be one of: research, enrichment, reports, signals' },
        { status: 400 }
      );
    }
    
    // Get queue statistics
    const stats = await QueueManager.getQueueStats();
    
    // If no specific queue requested, return all stats
    if (!queue) {
      const summary = {
        totalJobs: Object.values(stats).reduce((acc, queueStats) => 
          acc + Object.values(queueStats).reduce((sum, count) => sum + (count as number), 0), 0
        ),
        queues: stats,
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(summary);
    }
    
    // Return specific queue stats
    return NextResponse.json({
      queue,
      stats: stats[queue as keyof typeof stats],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job statistics' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create new jobs
export async function POST(request: NextRequest) {
  try {
    const { type, data, options = {} } = await request.json();
    
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Job type and data are required' },
        { status: 400 }
      );
    }
    
    let job;
    
    switch (type) {
      case 'research':
        if (!data.companyId || !data.companyName) {
          return NextResponse.json(
            { error: 'companyId and companyName are required for research jobs' },
            { status: 400 }
          );
        }
        job = await QueueManager.addResearchJob(data, options);
        break;
        
      case 'enrichment':
        if (!data.contactId || !data.companyId) {
          return NextResponse.json(
            { error: 'contactId and companyId are required for enrichment jobs' },
            { status: 400 }
          );
        }
        job = await QueueManager.addEnrichmentJob(data, options);
        break;
        
      case 'report':
        if (!data.companyId || !data.reportType || !data.userId) {
          return NextResponse.json(
            { error: 'companyId, reportType, and userId are required for report jobs' },
            { status: 400 }
          );
        }
        job = await QueueManager.addReportJob(data, options);
        break;
        
      case 'signal':
        if (!data.signalId || !data.signalType || !data.companyId) {
          return NextResponse.json(
            { error: 'signalId, signalType, and companyId are required for signal jobs' },
            { status: 400 }
          );
        }
        job = await QueueManager.addSignalJob(data, options);
        break;
        
      default:
        return NextResponse.json(
          { error: `Invalid job type: ${type}. Must be one of: research, enrichment, report, signal` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      jobType: type,
      queueName: job.queueName,
      priority: job.opts.priority,
      delay: job.opts.delay || 0,
      createdAt: new Date(job.timestamp).toISOString()
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs - Clean up queues or pause/resume
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'clean', 'pause', 'resume'
    
    switch (action) {
      case 'clean':
        await QueueManager.cleanQueues();
        return NextResponse.json({
          success: true,
          message: 'Queue cleanup completed'
        });
        
      case 'pause':
        await QueueManager.pauseAllQueues();
        return NextResponse.json({
          success: true,
          message: 'All queues paused'
        });
        
      case 'resume':
        await QueueManager.resumeAllQueues();
        return NextResponse.json({
          success: true,
          message: 'All queues resumed'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be one of: clean, pause, resume' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error managing queues:', error);
    return NextResponse.json(
      { error: 'Failed to manage queues', details: (error as Error).message },
      { status: 500 }
    );
  }
}