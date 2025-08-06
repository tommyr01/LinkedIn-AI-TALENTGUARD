# TalentGuard Buyer Intelligence - Deployment Guide

This guide covers how to deploy the TalentGuard Buyer Intelligence platform to various environments, with special focus on Vercel deployment and environment variable configuration.

## 🚀 Quick Start - Vercel Deployment

### 1. Prerequisites
- GitHub repository with your code
- Vercel account connected to GitHub
- Supabase project set up with database

### 2. Required Environment Variables
Add these to your Vercel project dashboard (**Settings → Environment Variables**):

**REQUIRED Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
USE_SUPABASE=true
NEXT_PUBLIC_USE_SUPABASE=true
```

**Optional Variables:**
```bash
OPENAI_API_KEY=your_openai_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
REDIS_HOST=your_redis_host
REDIS_PORT=6379
```

### 3. Deploy
1. Import your GitHub repository in Vercel
2. Configure environment variables (above)
3. Deploy - Vercel will automatically detect Next.js and build

## 🔧 Environment Configuration Details

### Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from **Settings → API**
3. Run the database migrations (see `docs/` folder for schema)
4. Configure row-level security policies as needed

### Environment Variables by Category

#### **Database Configuration**
```bash
# Primary database (choose one approach)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Or legacy Airtable (fallback)
AIRTABLE_API_KEY=patXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXX
AIRTABLE_COMPANIES_TABLE=tblXXXXXXX

# Feature flag
USE_SUPABASE=true
NEXT_PUBLIC_USE_SUPABASE=true
```

#### **Job Queue System (Optional)**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # if required
```

#### **AI Integration (Optional)**
```bash
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
```

## 🌍 Platform-Specific Deployment

### Vercel (Recommended)

**Automatic Deployment:**
1. Connect your GitHub repo to Vercel
2. Add environment variables in dashboard
3. Push to main branch → auto-deploy

**Manual Deployment:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Build Settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 18.x or higher

### Netlify

```bash
npm run build
npm run export  # if using static export
```

Environment variables: Add in Netlify dashboard under **Site settings → Environment variables**

### Railway

```bash
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
```

### Docker (Self-hosted)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t talentguard-app .
docker run -p 3000:3000 --env-file .env.local talentguard-app
```

## 🗄️ Database Migration

### From Airtable to Supabase
1. Export data: `node scripts/export-airtable.js`
2. Import to Supabase: `node scripts/import-supabase-fixed.js`
3. Verify migration: `node scripts/verify-migration.js`
4. Update environment variables to use Supabase

### Fresh Supabase Setup
1. Create tables using the schema in `docs/airtable-schema.md`
2. Set up row-level security policies
3. Add sample data: `node scripts/add-test-data-simple.js`

## ⚡ Job Queue System Deployment

### Redis Setup Options

**Option 1: Redis Cloud (Recommended for production)**
```bash
REDIS_URL=redis://username:password@host:port
```

**Option 2: Railway Redis**
```bash
# Railway automatically provides Redis connection vars
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
```

**Option 3: Self-hosted Docker**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Worker Deployment
Workers run as separate processes. Deploy options:

**Vercel Edge Functions (Serverless):**
- Convert workers to API routes with time limits
- Good for light processing

**Separate Server (Recommended):**
```bash
# On your worker server
npm install
npm run workers
```

**Docker Workers:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "run", "workers"]
```

## 🔍 Monitoring & Troubleshooting

### Build Issues

**"supabaseUrl is required" Error:**
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel dashboard
- Check that variable names are exact (case-sensitive)
- Verify Supabase URL format: `https://xxx.supabase.co`

**TypeScript Errors:**
```bash
npm run typecheck
```

**Missing Dependencies:**
```bash
npm install
```

### Runtime Issues

**Database Connection:**
- Test Supabase connection in dashboard
- Verify anon key permissions
- Check row-level security policies

**Environment Variables:**
```javascript
// Add this to any API route for debugging
console.log('Environment check:', {
  supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  useSupabase: process.env.USE_SUPABASE
});
```

### Health Check Endpoints

**Database Status:**
```
GET /api/accounts
```

**Queue Status:**
```
GET /api/jobs
```

**Environment Validation:**
Access any API route - will return configuration errors if Supabase isn't set up properly.

## 🔐 Security Best Practices

### Environment Variables
- Use different values for dev/staging/production
- Never commit `.env.local` to version control
- Rotate API keys regularly
- Use least-privilege access for database keys

### Supabase Security
- Configure row-level security (RLS) policies
- Use anon key for client-side (safe to expose)
- Keep service role key server-side only
- Enable email confirmation for auth if used

### API Rate Limiting
The platform includes built-in rate limiting for job queues:
- Research: 10 jobs/minute
- Enrichment: 50 jobs/minute  
- Reports: 20 jobs/hour
- Signals: No limit (real-time)

## 📊 Performance Optimization

### Next.js Optimizations
- Image optimization enabled by default
- Code splitting automatic
- Static generation where possible

### Database Optimizations
- Indexes on frequently queried fields
- Pagination for large datasets
- Connection pooling in production

### Caching Strategy
- SWR for client-side data caching
- Redis for job queue caching
- CDN for static assets

## 🆘 Support

### Common Commands
```bash
# Check build locally
npm run build

# Type checking
npm run typecheck

# Test database connection
node scripts/test-supabase-api.js

# Check queue status
curl https://yourapp.vercel.app/api/jobs

# View logs in Vercel
vercel logs
```

### Documentation Links
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)
- [BullMQ Documentation](https://docs.bullmq.io/)

### Getting Help
If you encounter deployment issues:
1. Check the build logs for specific error messages
2. Verify all required environment variables are set
3. Test database connectivity
4. Review the troubleshooting section above
5. Check GitHub issues or create a new one