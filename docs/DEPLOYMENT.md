# TalentGuard Buyer Intelligence - Production Deployment Guide

## Overview

This guide covers the complete production deployment process for the TalentGuard Buyer Intelligence platform, including infrastructure setup, monitoring, backup procedures, and maintenance.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended) or macOS
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 100GB SSD minimum, 500GB recommended
- **CPU**: 4 cores minimum, 8 cores recommended

### Domain & SSL
- Domain name configured (e.g., `talentguard.app`)
- DNS pointing to your server
- Email for Let's Encrypt SSL certificates

### External Services
- **Supabase**: Production database instance
- **OpenAI**: API key for AI content generation
- **Perplexity**: API key for web research
- **RapidAPI**: Key for LinkedIn data services

## Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd talentguard-buyer-intelligence

# Copy and configure environment
cp .env.production.template .env.production
# Edit .env.production with your production values
```

### 2. Configure Environment
Edit `.env.production` with your production values:

```bash
# Domain Configuration
DOMAIN=your-domain.com
NEXTAUTH_URL=https://your-domain.com
LETSENCRYPT_EMAIL=admin@your-domain.com

# Database Configuration
POSTGRES_DB=talentguard_prod
POSTGRES_PASSWORD=your_secure_password

# API Keys
OPENAI_API_KEY=sk-your_openai_key
PERPLEXITY_API_KEY=pplx-your_perplexity_key
RAPIDAPI_KEY=your_rapidapi_key

# Security
JWT_SECRET=your_jwt_secret_32_chars_minimum
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_minimum
```

### 3. Deploy
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

### 4. Setup Monitoring
```bash
# Configure Grafana dashboards
./scripts/setup-monitoring.sh
```

## Detailed Deployment Process

The production deployment includes complete infrastructure with monitoring, backup, and security features.

### Core Services
- **Next.js Application**: Main web application
- **PostgreSQL**: Primary database with persistence
- **Redis**: Caching and job queue with persistence
- **Worker Services**: Background job processors (2 replicas)
- **Traefik**: Reverse proxy with automatic SSL
- **Monitoring Stack**: Prometheus + Grafana + alerts

## Monitoring & Health Checks

### URLs After Deployment
- **Application**: `https://your-domain.com`
- **Health Check**: `https://your-domain.com/api/health`
- **Grafana**: `http://localhost:3001`
- **Prometheus**: `http://localhost:9090`

### Key Metrics Monitored
- Application uptime and response times
- Database connections and performance
- Memory and CPU usage
- Business metrics (connections, profiles, research)

## Backup & Security

### Automated Features
- Daily database backups (30-day retention)
- Automatic SSL certificates
- Security headers and CORS
- Rate limiting and authentication

### Manual Operations
```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

**Ready for Production**: The TalentGuard platform is now enterprise-ready with full monitoring, backup, and security infrastructure.