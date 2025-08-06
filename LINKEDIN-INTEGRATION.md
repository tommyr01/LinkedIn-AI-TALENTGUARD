# LinkedIn Integration for TalentGuard Buyer Intelligence

This integration transforms TalentGuard from a passive buyer intelligence tool into an active LinkedIn engagement platform that identifies and researches prospects based on content interaction patterns.

## 🎯 Key Features

### 1. LinkedIn Content Intelligence
- **Post Sync**: Automatically sync your LinkedIn posts and engagement metrics
- **Performance Analytics**: Track likes, comments, reposts, and different reaction types
- **Content Insights**: See which posts perform best and generate the most engagement
- **Media Tracking**: Monitor posts with documents, images, and other media

### 2. Prospect Identification & Research
- **Automatic Discovery**: Identify prospects who engage with your LinkedIn content
- **ICP Scoring**: Automatically score prospects based on:
  - Role seniority (CEO, CTO, VP, Director, etc.)
  - Company type (SaaS, Tech, Enterprise, etc.)
  - Industry relevance (HR, Technology, Consulting, etc.)
  - Engagement patterns
- **Confidence Rating**: Each prospect gets a confidence score based on data quality
- **Research Status**: Track which prospects have been researched

### 3. TalentGuard Integration
- **Contact Sync**: Add LinkedIn prospects directly to TalentGuard contacts
- **Signal Generation**: Create buyer signals from LinkedIn engagement activities
- **Account Mapping**: Connect LinkedIn companies to existing account records
- **Unified Dashboard**: View LinkedIn insights alongside existing TalentGuard data

## 📊 Dashboard Overview

### LinkedIn Content Dashboard (`/dashboard/linkedin/my-posts`)
- View all your LinkedIn posts with engagement metrics
- Real-time sync from LinkedIn API
- Performance analytics and insights
- Filter by date, content type, and engagement level

### LinkedIn Prospects Dashboard (`/dashboard/linkedin/prospects`)  
- High-value prospects identified from LinkedIn engagement
- ICP scoring and categorization (High/Medium/Low Value)
- Bulk actions to add to contacts or generate signals
- Search and filter by company, role, or ICP score

## 🛠️ Setup Instructions

### 1. Environment Variables
Add these to your `.env.local` file:

```bash
# RapidAPI Configuration (required for LinkedIn data)
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=linkedin-scraper-host.rapidapi.com

# LinkedIn Username to track  
LINKEDIN_USERNAME=your_linkedin_username
```

### 2. Database Setup
Run the LinkedIn schema migration in your Supabase database:
```sql
-- Execute scripts/linkedin-schema.sql in Supabase SQL Editor
-- This creates tables for posts, comments, profiles, and engagement tracking
```

### 3. RapidAPI Setup
1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to a LinkedIn scraping API service
3. Get your API key and host URL
4. Add to environment variables

## 🚀 Getting Started

### Step 1: Sync Your LinkedIn Posts
1. Navigate to **Dashboard → LinkedIn Content**
2. Click **"Sync from LinkedIn"** button
3. Wait for posts to be imported from LinkedIn API
4. View your posts with engagement analytics

### Step 2: Identify Prospects
1. LinkedIn engagement is automatically analyzed
2. Navigate to **Dashboard → LinkedIn Prospects**  
3. View high-value prospects identified from your post engagement
4. Use filters to find prospects by ICP score, company, or role

### Step 3: Take Action
1. **Bulk Actions**: Select multiple prospects for batch operations
2. **Add to Contacts**: Import prospects into TalentGuard contact database
3. **Generate Signals**: Create buyer signals from LinkedIn engagement
4. **Research Profiles**: View detailed ICP scoring and reasoning

## 📈 ICP Scoring Algorithm

The system automatically scores LinkedIn prospects based on:

### Role Scoring (25 points max)
- CEO, President, Founder: 25 points
- CTO, VP: 20 points  
- Director: 15 points
- Manager: 10 points

### Company/Industry Scoring (15 points max)
- SaaS, Software, Technology: 15 points
- Fintech: 12 points
- Enterprise, Consulting: 8 points

### Industry Alignment (20 points max)
- HR, Talent, People, Recruiting: 20 points (TalentGuard's target market)

### Engagement Scoring (10 points)
- Base score for commenting on content: 10 points

### Total Score Categories
- **High Value**: 70+ points (executive-level in target industries)
- **Medium Value**: 50-69 points (senior roles or target industries)
- **Low Value**: 30-49 points (relevant but lower priority)
- **Not Qualified**: <30 points

## 🔄 API Endpoints

### LinkedIn Posts
- `GET /api/linkedin/posts/list` - Fetch posts from database
- `POST /api/linkedin/posts/sync` - Sync posts from LinkedIn API

### LinkedIn Prospects  
- `GET /api/linkedin/prospects` - Fetch high-value prospects
- `POST /api/linkedin/prospects` - Bulk actions (add to contacts, generate signals)

## 💡 Best Practices

### Content Strategy
- Monitor which posts generate the most high-value engagement
- Focus on content that attracts executive-level prospects
- Track document shares and media performance

### Prospect Management
- Regular review prospects with ICP scores 60+
- Research high-confidence prospects first
- Use bulk actions to efficiently add prospects to your pipeline

### Data Quality
- Keep LinkedIn username updated in environment variables
- Sync posts regularly (weekly recommended)
- Monitor API usage to avoid rate limits

## 🔍 Troubleshooting

### Common Issues
1. **No posts showing**: Check RAPIDAPI_KEY and RAPIDAPI_HOST configuration
2. **Sync failures**: Verify LinkedIn username is correct
3. **Empty prospects**: Ensure posts have been synced and have engagement

### Debug Information
- Check browser console for API error messages
- Verify environment variables are set correctly
- Test API endpoints directly: `/api/linkedin/posts/sync`

## 🎉 Success Metrics

Track these KPIs to measure LinkedIn integration success:

- **Content Performance**: Average engagement per post
- **Prospect Quality**: Percentage of high-value prospects (70+ ICP score)  
- **Conversion Rate**: LinkedIn prospects converted to TalentGuard contacts
- **Pipeline Impact**: Buyer signals generated from LinkedIn engagement

## 📞 Support

For LinkedIn integration issues:
1. Check environment variables configuration
2. Verify Supabase LinkedIn tables exist
3. Test RapidAPI connection
4. Review API rate limits and usage

The LinkedIn integration seamlessly extends TalentGuard's buyer intelligence capabilities with real-time social engagement data, providing a complete picture of prospect behavior across both content interaction and traditional buying signals.