-- LinkedIn Integration Schema for TalentGuard Buyer Intelligence
-- Run this in your Supabase SQL editor to create the LinkedIn tables

-- LinkedIn Posts Table
CREATE TABLE IF NOT EXISTS public.linkedin_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    urn VARCHAR(255) UNIQUE NOT NULL,
    full_urn VARCHAR(255),
    posted_at TIMESTAMPTZ,
    text TEXT,
    url VARCHAR(500),
    post_type VARCHAR(50) DEFAULT 'regular',
    
    -- Author information
    author_first_name VARCHAR(255),
    author_last_name VARCHAR(255),
    author_headline TEXT,
    author_username VARCHAR(255),
    author_profile_url VARCHAR(500),
    author_profile_picture VARCHAR(500),
    
    -- Engagement metrics
    total_reactions INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    support_count INTEGER DEFAULT 0,
    love_count INTEGER DEFAULT 0,
    insight_count INTEGER DEFAULT 0,
    celebrate_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    
    -- Document/media information
    document_title VARCHAR(500),
    document_page_count INTEGER,
    document_url VARCHAR(500),
    document_thumbnail VARCHAR(500),
    
    -- Metadata
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LinkedIn Comments Table
CREATE TABLE IF NOT EXISTS public.linkedin_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id VARCHAR(255) UNIQUE NOT NULL,
    post_urn VARCHAR(255) NOT NULL REFERENCES public.linkedin_posts(urn) ON DELETE CASCADE,
    text TEXT,
    posted_at TIMESTAMPTZ,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    comment_url VARCHAR(500),
    
    -- Comment author
    author_name VARCHAR(255),
    author_headline TEXT,
    author_profile_url VARCHAR(500),
    author_profile_picture VARCHAR(500),
    
    -- Engagement metrics
    total_reactions INTEGER DEFAULT 0,
    like_reactions INTEGER DEFAULT 0,
    appreciation_reactions INTEGER DEFAULT 0,
    empathy_reactions INTEGER DEFAULT 0,
    interest_reactions INTEGER DEFAULT 0,
    praise_reactions INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    replies JSONB,
    replies_count INTEGER DEFAULT 0,
    
    -- ICP scoring
    icp_score INTEGER,
    icp_category VARCHAR(50),
    icp_breakdown JSONB,
    icp_tags TEXT[],
    icp_reasoning TEXT[],
    icp_confidence INTEGER DEFAULT 75,
    profile_researched BOOLEAN DEFAULT FALSE,
    research_completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LinkedIn Profiles Table (for prospect research)
CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_url VARCHAR(500) UNIQUE NOT NULL,
    name VARCHAR(255),
    headline TEXT,
    profile_picture VARCHAR(500),
    about TEXT,
    location VARCHAR(255),
    
    -- Professional information
    current_company VARCHAR(255),
    current_role VARCHAR(255),
    follower_count INTEGER DEFAULT 0,
    connection_count INTEGER DEFAULT 0,
    
    -- ICP scoring (enhanced)
    icp_score INTEGER,
    icp_category VARCHAR(50),
    icp_breakdown JSONB,
    icp_tags TEXT[],
    icp_reasoning TEXT[],
    icp_confidence INTEGER DEFAULT 75,
    data_quality VARCHAR(50) DEFAULT 'medium',
    signals TEXT[],
    red_flags TEXT[],
    
    -- Research metadata
    last_researched_at TIMESTAMPTZ,
    research_source VARCHAR(100) DEFAULT 'linkedin_comment',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Engagement History Table (for tracking performance over time)
CREATE TABLE IF NOT EXISTS public.post_engagement_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_urn VARCHAR(255) NOT NULL REFERENCES public.linkedin_posts(urn) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Snapshot of engagement metrics
    total_reactions INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    support_count INTEGER DEFAULT 0,
    love_count INTEGER DEFAULT 0,
    insight_count INTEGER DEFAULT 0,
    celebrate_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    
    -- Calculated metrics
    engagement_rate DECIMAL(5,2),
    growth_since_last_check INTEGER DEFAULT 0
);

-- LinkedIn Connections Table (for network analysis)
CREATE TABLE IF NOT EXISTS public.linkedin_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    headline TEXT,
    username VARCHAR(255) UNIQUE,
    profile_picture_url VARCHAR(500),
    about TEXT,
    full_location VARCHAR(255),
    hashtags TEXT,
    
    -- Profile flags
    is_creator BOOLEAN DEFAULT FALSE,
    is_influencer BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    show_follower_count BOOLEAN DEFAULT TRUE,
    background_picture_url VARCHAR(500),
    urn VARCHAR(255),
    
    -- Network metrics
    follower_count INTEGER DEFAULT 0,
    connection_count INTEGER DEFAULT 0,
    
    -- Current employment
    current_company VARCHAR(255),
    title VARCHAR(255),
    company_location VARCHAR(255),
    duration VARCHAR(255),
    start_date TIMESTAMPTZ,
    is_current BOOLEAN DEFAULT TRUE,
    company_linkedin_url VARCHAR(500),
    current_company_urn VARCHAR(255),
    
    -- Metadata
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection Posts Table (posts from network connections)
CREATE TABLE IF NOT EXISTS public.connection_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id UUID REFERENCES public.linkedin_connections(id) ON DELETE CASCADE,
    post_urn VARCHAR(255) UNIQUE NOT NULL,
    full_urn VARCHAR(255),
    posted_date TIMESTAMPTZ,
    relative_posted VARCHAR(100),
    post_type VARCHAR(50) DEFAULT 'regular',
    post_text TEXT,
    post_url VARCHAR(500),
    
    -- Author information (redundant but useful for queries)
    author_first_name VARCHAR(255),
    author_last_name VARCHAR(255),
    author_headline TEXT,
    username VARCHAR(255),
    author_linkedin_url VARCHAR(500),
    author_profile_picture VARCHAR(500),
    
    -- Engagement metrics
    total_reactions INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    support INTEGER DEFAULT 0,
    love INTEGER DEFAULT 0,
    insight INTEGER DEFAULT 0,
    celebrate INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts INTEGER DEFAULT 0,
    
    -- Media information
    media_type VARCHAR(50),
    media_url VARCHAR(500),
    media_thumbnail VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_urn ON public.linkedin_posts(urn);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_author_username ON public.linkedin_posts(author_username);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_posted_at ON public.linkedin_posts(posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_comments_post_urn ON public.linkedin_comments(post_urn);
CREATE INDEX IF NOT EXISTS idx_linkedin_comments_author_profile_url ON public.linkedin_comments(author_profile_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_comments_icp_score ON public.linkedin_comments(icp_score DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_profile_url ON public.linkedin_profiles(profile_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_icp_score ON public.linkedin_profiles(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_icp_category ON public.linkedin_profiles(icp_category);

CREATE INDEX IF NOT EXISTS idx_post_engagement_history_post_urn ON public.post_engagement_history(post_urn);
CREATE INDEX IF NOT EXISTS idx_post_engagement_history_recorded_at ON public.post_engagement_history(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_connections_username ON public.linkedin_connections(username);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_full_name ON public.linkedin_connections(full_name);

CREATE INDEX IF NOT EXISTS idx_connection_posts_connection_id ON public.connection_posts(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_posts_post_urn ON public.connection_posts(post_urn);

-- Create views for common queries

-- View: High Value Prospects (from LinkedIn engagement)
CREATE OR REPLACE VIEW public.high_value_linkedin_prospects AS
SELECT 
    p.id,
    p.profile_url,
    p.name,
    p.headline,
    p.current_company,
    p.current_role,
    p.icp_score,
    p.icp_category,
    p.icp_confidence,
    p.data_quality,
    p.signals,
    COUNT(c.id) as total_comments,
    MAX(c.posted_at) as last_engagement_date,
    p.last_researched_at,
    p.created_at
FROM public.linkedin_profiles p
LEFT JOIN public.linkedin_comments c ON p.profile_url = c.author_profile_url
WHERE p.icp_score >= 60
GROUP BY p.id, p.profile_url, p.name, p.headline, p.current_company, 
         p.current_role, p.icp_score, p.icp_category, p.icp_confidence,
         p.data_quality, p.signals, p.last_researched_at, p.created_at
ORDER BY p.icp_score DESC, total_comments DESC;

-- View: Posts with Latest Engagement Stats
CREATE OR REPLACE VIEW public.posts_with_latest_stats AS
SELECT 
    p.*,
    COALESCE(latest_engagement.total_reactions, p.total_reactions) as current_total_reactions,
    COALESCE(latest_engagement.comments_count, p.comments_count) as current_comments_count,
    latest_engagement.recorded_at as last_stats_update,
    (SELECT COUNT(*) FROM public.linkedin_comments c WHERE c.post_urn = p.urn) as actual_comments_count,
    (SELECT COUNT(*) FROM public.linkedin_comments c WHERE c.post_urn = p.urn AND c.icp_score >= 60) as high_value_comments
FROM public.linkedin_posts p
LEFT JOIN (
    SELECT DISTINCT ON (post_urn) 
        post_urn,
        total_reactions,
        comments_count,
        recorded_at
    FROM public.post_engagement_history
    ORDER BY post_urn, recorded_at DESC
) latest_engagement ON p.urn = latest_engagement.post_urn
ORDER BY p.posted_at DESC;

-- View: LinkedIn Engagement Summary by Contact (if linking to existing TalentGuard contacts)
CREATE OR REPLACE VIEW public.linkedin_contact_engagement AS
SELECT 
    c.id as contact_id,
    c.name as contact_name,
    c.email,
    c.linkedin_url,
    p.profile_url as linkedin_profile_url,
    p.icp_score,
    p.icp_category,
    COUNT(lc.id) as total_linkedin_comments,
    MAX(lc.posted_at) as last_linkedin_engagement,
    p.last_researched_at
FROM public.contacts c
LEFT JOIN public.linkedin_profiles p ON c.linkedin_url LIKE '%' || SPLIT_PART(p.profile_url, '/', 5) || '%'
LEFT JOIN public.linkedin_comments lc ON p.profile_url = lc.author_profile_url
WHERE c.linkedin_url IS NOT NULL AND c.linkedin_url != ''
GROUP BY c.id, c.name, c.email, c.linkedin_url, p.profile_url, p.icp_score, p.icp_category, p.last_researched_at
HAVING COUNT(lc.id) > 0
ORDER BY total_linkedin_comments DESC, p.icp_score DESC;

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.linkedin_comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.post_engagement_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.connection_posts ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your security setup)
GRANT ALL ON public.linkedin_posts TO authenticated;
GRANT ALL ON public.linkedin_comments TO authenticated;
GRANT ALL ON public.linkedin_profiles TO authenticated;
GRANT ALL ON public.post_engagement_history TO authenticated;
GRANT ALL ON public.linkedin_connections TO authenticated;
GRANT ALL ON public.connection_posts TO authenticated;

GRANT SELECT ON public.high_value_linkedin_prospects TO authenticated;
GRANT SELECT ON public.posts_with_latest_stats TO authenticated;
GRANT SELECT ON public.linkedin_contact_engagement TO authenticated;