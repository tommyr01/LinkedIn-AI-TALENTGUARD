-- Database Schema Extensions for Connection Intelligence Research
-- Add these tables to your Supabase database to store intelligence research results

-- Table to store web research results
CREATE TABLE IF NOT EXISTS web_research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES linkedin_connections(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  articles_found JSONB DEFAULT '[]'::jsonb, -- Array of WebArticle objects
  expertise_signals JSONB DEFAULT '[]'::jsonb, -- Array of ExpertiseSignal objects
  talent_management_score INTEGER DEFAULT 0,
  people_development_score INTEGER DEFAULT 0,
  hr_technology_score INTEGER DEFAULT 0,
  leadership_score INTEGER DEFAULT 0,
  overall_relevance_score INTEGER DEFAULT 0,
  research_quality TEXT CHECK (research_quality IN ('high', 'medium', 'low')) DEFAULT 'medium',
  researched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store LinkedIn deep analysis results
CREATE TABLE IF NOT EXISTS linkedin_deep_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES linkedin_connections(id) ON DELETE CASCADE,
  articles_analysis JSONB DEFAULT '[]'::jsonb, -- Array of LinkedInArticle objects
  posts_analysis JSONB DEFAULT '[]'::jsonb, -- Array of PostAnalysis objects
  activity_patterns JSONB DEFAULT '{}'::jsonb, -- ActivityPatternAnalysis object
  profile_analysis JSONB DEFAULT '{}'::jsonb, -- LinkedInProfileAnalysis object
  expertise_scores JSONB DEFAULT '{}'::jsonb, -- Expertise scores object
  authority_assessment JSONB DEFAULT '{}'::jsonb, -- Authority assessment object
  analysed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store combined intelligence profiles
CREATE TABLE IF NOT EXISTS connection_intelligence_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES linkedin_connections(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  profile_url TEXT,
  
  -- Reference to research results
  web_research_id UUID REFERENCES web_research_results(id),
  linkedin_analysis_id UUID REFERENCES linkedin_deep_analysis(id),
  
  -- Unified scores
  unified_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Intelligence assessment
  data_quality TEXT CHECK (data_quality IN ('high', 'medium', 'low')) DEFAULT 'medium',
  confidence_level INTEGER DEFAULT 50 CHECK (confidence_level >= 0 AND confidence_level <= 100),
  verification_status TEXT CHECK (verification_status IN ('verified', 'likely', 'unverified')) DEFAULT 'unverified',
  expertise_verification JSONB DEFAULT '[]'::jsonb, -- Array of ExpertiseVerification objects
  red_flags JSONB DEFAULT '[]'::jsonb, -- Array of strings
  strengths JSONB DEFAULT '[]'::jsonb, -- Array of strings
  recommendations JSONB DEFAULT '[]'::jsonb, -- Array of strings
  
  -- Metadata
  research_duration INTEGER DEFAULT 0, -- in seconds
  researched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store batch research requests and results
CREATE TABLE IF NOT EXISTS batch_research_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE NOT NULL,
  connection_ids JSONB NOT NULL, -- Array of connection IDs
  priority_order TEXT DEFAULT 'random' CHECK (priority_order IN ('expertise_potential', 'engagement_level', 'company_relevance', 'random')),
  max_concurrency INTEGER DEFAULT 3,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  total_connections INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  in_progress INTEGER DEFAULT 0,
  
  -- Results summary
  high_value_prospects INTEGER DEFAULT 0,
  average_expertise_score INTEGER DEFAULT 0,
  top_expertise_areas JSONB DEFAULT '[]'::jsonb,
  research_quality_distribution JSONB DEFAULT '{"high": 0, "medium": 0, "low": 0}'::jsonb,
  
  -- Processing metadata
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store batch processing errors
CREATE TABLE IF NOT EXISTS batch_research_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_request_id UUID NOT NULL REFERENCES batch_research_requests(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store expertise signals for easier querying
CREATE TABLE IF NOT EXISTS expertise_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES linkedin_connections(id) ON DELETE CASCADE,
  intelligence_profile_id UUID REFERENCES connection_intelligence_profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- 'web' or 'linkedin'
  signal TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  source TEXT NOT NULL, -- 'content', 'title', 'metadata', etc.
  context TEXT,
  category TEXT, -- 'talent_management', 'people_development', 'hr_technology', 'leadership'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table to store web articles for reference
CREATE TABLE IF NOT EXISTS web_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES linkedin_connections(id) ON DELETE CASCADE,
  web_research_id UUID REFERENCES web_research_results(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  source TEXT,
  relevance_score INTEGER DEFAULT 0,
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_web_research_connection ON web_research_results(connection_id);
CREATE INDEX IF NOT EXISTS idx_web_research_researched_at ON web_research_results(researched_at);
CREATE INDEX IF NOT EXISTS idx_web_research_overall_score ON web_research_results(overall_relevance_score);

CREATE INDEX IF NOT EXISTS idx_linkedin_analysis_connection ON linkedin_deep_analysis(connection_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_analysis_analysed_at ON linkedin_deep_analysis(analysed_at);

CREATE INDEX IF NOT EXISTS idx_intelligence_profiles_connection ON connection_intelligence_profiles(connection_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_profiles_verification ON connection_intelligence_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_intelligence_profiles_confidence ON connection_intelligence_profiles(confidence_level);
CREATE INDEX IF NOT EXISTS idx_intelligence_profiles_researched_at ON connection_intelligence_profiles(researched_at);

CREATE INDEX IF NOT EXISTS idx_batch_requests_status ON batch_research_requests(status);
CREATE INDEX IF NOT EXISTS idx_batch_requests_request_id ON batch_research_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_batch_requests_created_at ON batch_research_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_expertise_signals_connection ON expertise_signals(connection_id);
CREATE INDEX IF NOT EXISTS idx_expertise_signals_category ON expertise_signals(category);
CREATE INDEX IF NOT EXISTS idx_expertise_signals_confidence ON expertise_signals(confidence);

CREATE INDEX IF NOT EXISTS idx_web_articles_connection ON web_articles(connection_id);
CREATE INDEX IF NOT EXISTS idx_web_articles_relevance ON web_articles(relevance_score);
CREATE INDEX IF NOT EXISTS idx_web_articles_url ON web_articles(url);

-- Create a view for high-value prospects
CREATE OR REPLACE VIEW high_value_talent_prospects AS
SELECT 
  cip.*,
  lc.full_name,
  lc.current_company,
  lc.title,
  lc.headline,
  lc.username,
  (cip.unified_scores->>'overallExpertise')::integer as overall_expertise,
  (cip.unified_scores->>'talentManagement')::integer as talent_management_score,
  (cip.unified_scores->>'peopleDevelopment')::integer as people_development_score,
  (cip.unified_scores->>'hrTechnology')::integer as hr_technology_score
FROM connection_intelligence_profiles cip
JOIN linkedin_connections lc ON cip.connection_id = lc.id
WHERE 
  (cip.unified_scores->>'overallExpertise')::integer > 70
  AND cip.verification_status IN ('verified', 'likely')
  AND cip.confidence_level > 60
ORDER BY 
  (cip.unified_scores->>'overallExpertise')::integer DESC,
  cip.confidence_level DESC;

-- Create a view for expertise analysis
CREATE OR REPLACE VIEW expertise_analysis_summary AS
SELECT 
  lc.full_name,
  lc.current_company,
  lc.title,
  COUNT(DISTINCT es.id) as total_signals,
  COUNT(DISTINCT CASE WHEN es.category = 'talent_management' THEN es.id END) as talent_signals,
  COUNT(DISTINCT CASE WHEN es.category = 'people_development' THEN es.id END) as people_dev_signals,
  COUNT(DISTINCT CASE WHEN es.category = 'hr_technology' THEN es.id END) as hr_tech_signals,
  COUNT(DISTINCT CASE WHEN es.category = 'leadership' THEN es.id END) as leadership_signals,
  AVG(es.confidence) as avg_confidence,
  MAX(es.confidence) as max_confidence,
  COUNT(DISTINCT wa.id) as web_articles_found,
  AVG(wa.relevance_score) as avg_article_relevance
FROM linkedin_connections lc
LEFT JOIN expertise_signals es ON lc.id = es.connection_id
LEFT JOIN web_articles wa ON lc.id = wa.connection_id
GROUP BY lc.id, lc.full_name, lc.current_company, lc.title
HAVING COUNT(DISTINCT es.id) > 0
ORDER BY total_signals DESC, avg_confidence DESC;

-- Create a function to update intelligence profile timestamps
CREATE OR REPLACE FUNCTION update_intelligence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update timestamps
CREATE TRIGGER update_web_research_timestamp
  BEFORE UPDATE ON web_research_results
  FOR EACH ROW EXECUTE FUNCTION update_intelligence_timestamp();

CREATE TRIGGER update_linkedin_analysis_timestamp
  BEFORE UPDATE ON linkedin_deep_analysis
  FOR EACH ROW EXECUTE FUNCTION update_intelligence_timestamp();

CREATE TRIGGER update_intelligence_profiles_timestamp
  BEFORE UPDATE ON connection_intelligence_profiles
  FOR EACH ROW EXECUTE FUNCTION update_intelligence_timestamp();

CREATE TRIGGER update_batch_requests_timestamp
  BEFORE UPDATE ON batch_research_requests
  FOR EACH ROW EXECUTE FUNCTION update_intelligence_timestamp();

-- Grant permissions (adjust as needed for your setup)
-- These would typically be run by a database admin
/*
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO authenticated;
*/