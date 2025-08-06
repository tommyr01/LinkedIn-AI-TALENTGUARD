# TalentGuard Buyer Intelligence - Job Queue System

This document describes the background job processing system built with Redis and BullMQ for handling AI research, contact enrichment, automated reporting, and signal processing.

## 🏗️ Architecture Overview

The job queue system consists of:
- **Redis**: In-memory data store for queue management
- **BullMQ**: Robust job queue library with advanced features
- **Workers**: Background processes that execute jobs
- **API Endpoints**: REST APIs for job management and monitoring

## 🚀 Quick Start

### Prerequisites
- Docker (recommended) or Redis server
- Node.js 18+ with npm

### 1. Start Redis
```bash
# Using Docker (recommended)
npm run redis:start

# Or using Docker Compose
docker-compose up redis -d

# Or install Redis locally
brew install redis  # macOS
redis-server        # Start Redis
```

### 2. Start Workers
```bash
# Start all background workers
npm run workers

# Or start workers with Next.js dev server
npm run workers:dev
```

### 3. Monitor Queues
```bash
# Check queue status
npm run queue:status
curl http://localhost:3000/api/jobs

# View Redis data (if using Docker Compose)
# Navigate to: http://localhost:8081
```

## 🎯 Job Types

### 1. Research Jobs (`research` queue)
Generates AI-powered company research and news analysis.

**API:**
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "research", 
    "data": {
      "companyId": "comp_123",
      "companyName": "Acme Corp",
      "domain": "acme.com",
      "priority": "high"
    }
  }'
```

**Data Fields:**
- `companyId` (required): Company identifier
- `companyName` (required): Company name for research
- `domain` (optional): Company website domain
- `priority` (optional): `low` | `normal` | `high`
- `userId` (optional): User who requested the research

**Output:** Creates research records with AI-generated insights, competitive analysis, and news summaries.

### 2. Enrichment Jobs (`enrichment` queue)
Enriches contact information from LinkedIn and email validation services.

**API:**
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "enrichment",
    "data": {
      "contactId": "contact_456",
      "companyId": "comp_123",
      "linkedinUrl": "https://linkedin.com/in/john-doe",
      "email": "john@acme.com",
      "priority": "normal"
    }
  }'
```

**Data Fields:**
- `contactId` (required): Contact identifier to enrich
- `companyId` (required): Associated company identifier
- `linkedinUrl` (optional): LinkedIn profile URL for enrichment
- `email` (optional): Email address for validation and enrichment
- `priority` (optional): Job priority level

**Output:** Updates contact records with enriched data like job title, company info, skills, and email validation status.

### 3. Report Jobs (`reports` queue)
Generates automated analytics reports (weekly, monthly, quarterly).

**API:**
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "report",
    "data": {
      "companyId": "comp_123",
      "reportType": "weekly",
      "userId": "user_789",
      "emailTo": "manager@company.com"
    }
  }'
```

**Data Fields:**
- `companyId` (required): Company to generate report for
- `reportType` (required): `weekly` | `monthly` | `quarterly`
- `userId` (required): User generating the report
- `emailTo` (optional): Email address to send completed report

**Output:** Creates comprehensive reports with metrics, insights, and recommendations.

### 4. Signal Jobs (`signals` queue)
Processes real-time signals and triggers (high priority, fast processing).

**API:**
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "signal",
    "data": {
      "signalId": "sig_999",
      "signalType": "Email Open",
      "companyId": "comp_123",
      "data": {"timestamp": "2024-01-15T10:30:00Z"}
    }
  }'
```

**Data Fields:**
- `signalId` (required): Unique signal identifier
- `signalType` (required): Type of signal (Email Open, Website Visit, etc.)
- `companyId` (required): Associated company
- `data` (required): Signal-specific payload data

**Output:** Processes and stores signal data with analytics updates.

## 🔧 API Endpoints

### Job Management

#### GET `/api/jobs`
Get overall queue statistics and job counts.

```bash
curl http://localhost:3000/api/jobs
```

**Response:**
```json
{
  "totalJobs": 45,
  "queues": {
    "research": {"waiting": 3, "active": 1, "completed": 12, "failed": 0},
    "enrichment": {"waiting": 8, "active": 2, "completed": 25, "failed": 1},
    "reports": {"waiting": 0, "active": 0, "completed": 5, "failed": 0},
    "signals": {"waiting": 1, "active": 0, "completed": 15, "failed": 0}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### GET `/api/jobs/{jobId}`
Get specific job status and details.

```bash
curl http://localhost:3000/api/jobs/job_12345
```

**Response:**
```json
{
  "id": "job_12345",
  "name": "company-research",
  "queue": "research",
  "status": "completed",
  "progress": 100,
  "duration": 8500,
  "createdAt": "2024-01-15T10:25:00Z",
  "finishedAt": "2024-01-15T10:25:08Z",
  "data": {"companyId": "comp_123", "companyName": "Acme Corp"},
  "returnvalue": {"researchId": "res_456", "sentiment": "positive"}
}
```

#### DELETE `/api/jobs/{jobId}`
Cancel or retry a specific job.

```bash
# Remove job
curl -X DELETE http://localhost:3000/api/jobs/job_12345?action=remove

# Retry failed job  
curl -X DELETE http://localhost:3000/api/jobs/job_12345?action=retry
```

### Queue Management

#### GET `/api/queues/{queueName}`
Get detailed queue information and jobs.

```bash
# Get queue stats only
curl http://localhost:3000/api/queues/research

# Include recent jobs
curl http://localhost:3000/api/queues/research?includeJobs=true&limit=20

# Filter by job status
curl http://localhost:3000/api/queues/research?includeJobs=true&status=failed
```

#### POST `/api/queues/{queueName}`
Queue management actions.

```bash
# Pause queue
curl -X POST http://localhost:3000/api/queues/research \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'

# Resume queue
curl -X POST http://localhost:3000/api/queues/research \
  -H "Content-Type: application/json" \
  -d '{"action": "resume"}'

# Clean completed jobs older than 24h
curl -X POST http://localhost:3000/api/queues/research \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean",
    "options": {
      "grace": 86400000,
      "limit": 100, 
      "type": "completed"
    }
  }'
```

#### DELETE `/api/queues/{queueName}`
Bulk job removal.

```bash
# Remove specific jobs
curl -X DELETE "http://localhost:3000/api/queues/research?jobIds=job1,job2,job3"

# Remove all failed jobs
curl -X DELETE "http://localhost:3000/api/queues/research?status=failed"
```

## 🛠️ Development

### Running Components

```bash
# Start Redis only
npm run redis:start

# Start workers only
npm run workers

# Start everything (Next.js + Workers)
npm run workers:dev

# Stop Redis
npm run redis:stop
```

### Adding New Job Types

1. **Define job data interface** in `src/lib/queue.ts`:
```typescript
export interface MyJobData {
  id: string;
  data: any;
  priority?: 'low' | 'normal' | 'high';
}
```

2. **Create queue** in `src/lib/queue.ts`:
```typescript
export const myQueue = new Queue<MyJobData>('my-queue', {
  connection: redisConnection,
  defaultJobOptions: { /* ... */ }
});
```

3. **Add queue manager methods** in `QueueManager` class:
```typescript
static async addMyJob(data: MyJobData) {
  return await myQueue.add('my-job', data);
}
```

4. **Create worker** in `src/workers/my-worker.ts`:
```typescript
const myWorker = new Worker<MyJobData>('my-queue', async (job) => {
  // Process job logic here
  return { success: true };
}, { connection: redisConnection });
```

5. **Update API endpoints** to handle the new job type.

6. **Add worker to startup script** in `scripts/start-workers.js`.

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=        # Optional
REDIS_URL=            # Alternative: full connection URL

# Database (existing)
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 🔍 Monitoring & Debugging

### Redis Commander UI
If using Docker Compose, access Redis data at: http://localhost:8081

### Queue Statistics
Monitor queue health and job counts:
```bash
curl http://localhost:3000/api/jobs | jq
```

### Worker Logs
Workers output detailed logs including:
- Job start/completion messages
- Progress updates  
- Error details
- Performance metrics

### Job Retry Logic
- **Research Jobs**: 3 attempts with exponential backoff (2s base delay)
- **Enrichment Jobs**: 2 attempts with fixed 5s delay
- **Report Jobs**: 2 attempts with 1s delay
- **Signal Jobs**: 5 attempts with exponential backoff (1s base delay)

### Rate Limiting
- **Research**: Max 10 jobs per minute
- **Enrichment**: Max 50 jobs per minute (API rate limits)
- **Reports**: Max 20 jobs per hour
- **Signals**: No rate limit (high priority)

## 🚨 Troubleshooting

### Common Issues

**Redis Connection Failed:**
```bash
# Check Redis is running
docker ps | grep redis
# or
redis-cli ping
```

**Worker Not Processing Jobs:**
- Check worker logs for errors
- Verify Redis connection
- Ensure queue names match exactly
- Check job data validation

**High Memory Usage:**
```bash
# Clean old jobs
npm run queue:clean

# Or via API
curl -X POST http://localhost:3000/api/queues/research \
  -d '{"action":"clean","options":{"grace":3600000}}'
```

**Job Stuck in Active State:**
- Check worker health
- Restart workers: `Ctrl+C` then `npm run workers`
- Review job timeout settings

### Performance Tuning

**Worker Concurrency:**
Adjust worker concurrency in worker files:
```typescript
const worker = new Worker('queue-name', processorFn, {
  concurrency: 5,  // Adjust based on workload
  // ...
});
```

**Queue Settings:**
Modify queue retention in `src/lib/queue.ts`:
```typescript
defaultJobOptions: {
  removeOnComplete: 100,  // Keep last 100 completed
  removeOnFail: 50,      // Keep last 50 failed
}
```

## 📈 Production Considerations

### Scaling
- **Horizontal**: Run multiple worker instances
- **Vertical**: Increase worker concurrency
- **Queue-specific**: Scale individual queue workers based on load

### Monitoring
- Implement health checks for worker processes
- Set up alerts for failed jobs and queue depths
- Monitor Redis memory usage and performance

### Security
- Use Redis AUTH in production
- Secure Redis network access
- Validate all job data inputs
- Implement user permissions for job creation

### Backup & Recovery
- Configure Redis persistence (AOF/RDB)
- Monitor disk usage for Redis data
- Plan for Redis failover scenarios