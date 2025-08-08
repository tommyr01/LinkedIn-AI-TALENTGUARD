# TalentGuard Buyer Intelligence - Docker Development Guide

This guide covers the complete Docker containerization setup for local development of the TalentGuard Buyer Intelligence platform.

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template and configure your settings
cp .env.example .env.local

# Edit .env.local with your actual API keys and configuration
# See Environment Configuration section below for required variables
```

### 2. Start Development Environment
```bash
# Start all services with hot reloading
npm run docker:dev

# Or start in detached mode (background)
npm run docker:dev:detached
```

### 3. Access Services
- **Application**: http://localhost:3000
- **Redis Commander**: http://localhost:8081
- **pgAdmin** (optional): http://localhost:8080 (see Optional Tools section)

## 🏗️ Architecture Overview

The Docker setup includes:

- **app**: Next.js 14 application with hot reloading
- **workers**: Background job processing (BullMQ workers)
- **redis**: Job queue and caching
- **postgres**: Local database for development
- **redis-commander**: Redis management UI
- **pgAdmin** (optional): PostgreSQL management UI

## 📋 Available Commands

### Development Commands
```bash
# Start development environment
npm run docker:dev              # Start with logs
npm run docker:dev:detached     # Start in background

# View logs
npm run docker:dev:logs         # All services
npm run docker:dev:logs:app     # Application only
npm run docker:dev:logs:workers # Workers only

# Stop and restart
npm run docker:stop             # Stop all containers
npm run docker:restart          # Restart all containers
npm run docker:restart:app      # Restart app container only
npm run docker:rebuild          # Full rebuild and restart
```

### Container Management
```bash
# Access container shells
npm run docker:shell           # Application container
npm run docker:shell:workers   # Workers container

# Database access
npm run docker:db:shell        # PostgreSQL shell
npm run docker:redis:cli       # Redis CLI

# Health check
npm run docker:health          # Check container status
```

### Optional Tools
```bash
# Start pgAdmin for database management
npm run docker:tools           # Start pgAdmin
npm run docker:tools:stop      # Stop pgAdmin
```

### Testing in Docker
```bash
# Run tests inside containers
npm run test:docker            # Run all tests
npm run test:docker:watch      # Watch mode
npm run test:docker:coverage   # With coverage
```

### Cleanup
```bash
# Remove containers but keep data
npm run docker:stop

# Remove containers and volumes (⚠️ deletes data)
npm run docker:stop:volumes

# Clean up Docker system
npm run docker:clean
```

## 🔧 Environment Configuration

### Required Environment Variables

Create `.env.local` from `.env.example` and configure:

#### Essential for Basic Functionality
```bash
# Database (use Docker service name)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/talentguard

# Redis (use Docker service name)
REDIS_URL=redis://redis:6379

# JWT Security
JWT_SECRET=your-very-secure-jwt-secret-key-here
NEXTAUTH_SECRET=your-nextauth-secret-here
```

#### API Integrations
```bash
# LinkedIn Intelligence
RAPIDAPI_KEY=your-rapidapi-key
LINKEDIN_SCRAPER_API_KEY=your-linkedin-scraper-api-key

# AI Services
OPENAI_API_KEY=your-openai-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key

# Supabase (if using production database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## 🐳 Docker Services Details

### Application Service (`app`)
- **Image**: Custom built from Dockerfile (development target)
- **Port**: 3000
- **Features**: 
  - Hot reloading with volume mounts
  - Development dependencies included
  - Health checks enabled
  - Automatic restart on code changes

### Workers Service (`workers`)
- **Image**: Same as app service
- **Purpose**: Background job processing
- **Features**:
  - BullMQ job processing
  - Shared code base with app
  - Redis connection for job queue

### Redis Service
- **Image**: redis:7-alpine
- **Port**: 6379
- **Features**:
  - Persistent data storage
  - Health checks
  - Redis Commander UI

### PostgreSQL Service
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Features**:
  - Local development database
  - Schema initialization
  - Health checks
  - Optional pgAdmin UI

## 🔄 Development Workflow

### 1. Daily Development
```bash
# Start your development session
npm run docker:dev:detached

# Check everything is healthy
npm run docker:health

# View logs if needed
npm run docker:dev:logs:app

# Your code changes will hot-reload automatically!
```

### 2. Debugging
```bash
# Access application container for debugging
npm run docker:shell

# Check database contents
npm run docker:db:shell

# Inspect Redis queues
npm run docker:redis:cli

# View specific service logs
npm run docker:dev:logs:workers
```

### 3. Testing
```bash
# Run tests in container environment
npm run test:docker

# Run specific test suites
docker-compose exec app npm run test:unit
docker-compose exec app npm run test:integration
```

## 🛠️ Hot Reloading & Development Features

### File Watching
- Source code (`src/`) is mounted as a volume
- Changes trigger automatic rebuilds
- Next.js development server handles HMR
- Worker processes restart on changes

### Debugging Support
- Node.js debugging ports exposed
- Development dependencies available
- Full TypeScript support
- ESLint and Prettier integration

### Database Development
- Local PostgreSQL with sample data
- Schema auto-initialization
- pgAdmin for visual database management
- Easy data reset and migration testing

## 📊 Service Health Monitoring

### Health Check URLs
```bash
# Application health
curl http://localhost:3000/api/auth/me

# Redis health
docker-compose exec redis redis-cli ping

# PostgreSQL health  
docker-compose exec postgres pg_isready -U postgres -d talentguard
```

### Service Dependencies
- App waits for Redis and PostgreSQL to be healthy
- Workers wait for Redis and PostgreSQL to be healthy
- Redis Commander waits for Redis
- pgAdmin waits for PostgreSQL

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Stop conflicting services
npm run docker:stop
```

#### 2. Environment Variables Not Loading
```bash
# Verify .env.local exists and has correct format
cat .env.local

# Restart containers to reload environment
npm run docker:restart
```

#### 3. Database Connection Issues
```bash
# Check PostgreSQL container health
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Reset database (⚠️ deletes data)
docker-compose down -v
docker-compose up postgres -d
```

#### 4. Redis Connection Issues
```bash
# Check Redis container health
docker-compose ps redis

# Test Redis connection
npm run docker:redis:cli
> ping
```

#### 5. Hot Reloading Not Working
```bash
# Restart app container
npm run docker:restart:app

# Check volume mounts
docker-compose exec app ls -la /app
```

#### 6. Build Failures
```bash
# Clean rebuild
npm run docker:rebuild

# Clean Docker system
npm run docker:clean

# Build with verbose output
docker-compose build --no-cache --progress=plain app
```

### Debug Mode
Enable detailed logging:
```bash
# Add to .env.local
DEBUG_LINKEDIN_API=true
DEBUG_QUEUE_PROCESSING=true
DEBUG_AI_PROCESSING=true
LOG_LEVEL=debug
```

### Container Resource Issues
```bash
# Check container resource usage
docker stats

# Increase Docker Desktop memory allocation if needed
# Docker Desktop → Settings → Resources → Advanced
```

## 🔧 Advanced Configuration

### Custom Port Configuration
```bash
# Override ports in .env.local
APP_PORT=3001
REDIS_PORT=6380
POSTGRES_PORT=5433
REDIS_COMMANDER_PORT=8082
PGADMIN_PORT=8081
```

### Production-like Testing
```bash
# Build production image
docker-compose build --target runner app

# Test with production environment
NODE_ENV=production npm run docker:dev
```

### Volume Management
```bash
# Inspect volumes
docker volume ls | grep talentguard

# Backup database volume
docker run --rm -v talentguard-buyer-intelligence_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /data .

# Restore database volume
docker run --rm -v talentguard-buyer-intelligence_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /data
```

## 📝 Performance Optimization

### Development Performance Tips

1. **Use .dockerignore**: Already configured to exclude unnecessary files
2. **Layer Caching**: Dependencies are cached in separate layers
3. **Volume Mounts**: Only essential directories are mounted for hot reloading
4. **Resource Limits**: Configure Docker Desktop with adequate resources

### Recommended Docker Settings
- **Memory**: 8GB minimum, 16GB recommended
- **CPU**: 4 cores minimum
- **Storage**: 50GB available space

## 🔐 Security Considerations

### Development Security
- Non-root user in containers
- Secrets via environment files (not in Docker images)
- Local network isolation
- Regular base image updates

### Production Preparation
- Multi-stage builds reduce image size
- Security scanning enabled
- Minimal runtime dependencies
- Health checks configured

## 📚 Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review container logs: `npm run docker:dev:logs`
3. Verify environment configuration
4. Test individual services
5. Check Docker system resources

For persistent issues, include the following in your support request:
- Output of `npm run docker:health`
- Relevant logs from `npm run docker:dev:logs`
- Your `.env.local` configuration (redacted)
- Docker Desktop version and system specifications