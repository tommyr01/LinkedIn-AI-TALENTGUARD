-- Tone of Voice Database Schema for TalentGuard Buyer Intelligence
-- Enhanced tone management system beyond the basic user_preferences

-- Table for detailed tone profiles with versioning
CREATE TABLE IF NOT EXISTS tone_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Core tone characteristics
  formality_level VARCHAR(20) NOT NULL CHECK (formality_level IN ('professional', 'conversational', 'casual')),
  communication_style VARCHAR(20) NOT NULL CHECK (communication_style IN ('direct', 'collaborative', 'consultative')),
  
  -- Personality traits (stored as array)
  personality_traits TEXT[] DEFAULT ARRAY[]::TEXT[] CHECK (
    personality_traits <@ ARRAY['enthusiastic', 'analytical', 'supportive', 'authoritative', 'empathetic', 'innovative']
  ),
  
  -- Industry-specific language preferences
  industry_language VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (
    industry_language IN ('hr_tech', 'leadership_development', 'sales', 'general', 'consulting')
  ),
  
  -- Advanced customization
  custom_elements TEXT, -- Custom instructions or examples
  sample_phrases JSONB DEFAULT '[]'::jsonb, -- Array of example phrases
  avoid_words TEXT[] DEFAULT ARRAY[]::TEXT[], -- Words/phrases to avoid
  preferred_greetings TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_closings TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- AI model preferences  
  ai_temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (ai_temperature >= 0.0 AND ai_temperature <= 2.0),
  ai_max_tokens INTEGER DEFAULT 1000 CHECK (ai_max_tokens >= 50 AND ai_max_tokens <= 4000),
  ai_model VARCHAR(50) DEFAULT 'gpt-4',
  
  -- Usage and performance tracking
  usage_count INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(4,2) DEFAULT 0.0 CHECK (effectiveness_score >= 0.0 AND effectiveness_score <= 100.0),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for tone profile usage analytics
CREATE TABLE IF NOT EXISTS tone_profile_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tone_profile_id UUID NOT NULL REFERENCES tone_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Usage context
  usage_context VARCHAR(50) NOT NULL CHECK (
    usage_context IN ('linkedin_comment', 'linkedin_reply', 'email_draft', 'general_content')
  ),
  
  -- Content details
  original_prompt TEXT,
  generated_content TEXT,
  final_content TEXT, -- After user edits
  content_length INTEGER,
  
  -- Performance metrics
  user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating >= 1 AND user_satisfaction_rating <= 5),
  generation_time_ms INTEGER,
  edit_count INTEGER DEFAULT 0, -- Number of times user edited the output
  was_used BOOLEAN DEFAULT false, -- Whether the user actually used the content
  
  -- Feedback
  feedback_notes TEXT,
  improvement_suggestions TEXT,
  
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for tone profile templates (system-provided)
CREATE TABLE IF NOT EXISTS tone_profile_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  
  -- Template configuration (mirrors tone_profiles structure)
  formality_level VARCHAR(20) NOT NULL,
  communication_style VARCHAR(20) NOT NULL,
  personality_traits TEXT[] DEFAULT ARRAY[]::TEXT[],
  industry_language VARCHAR(20) NOT NULL DEFAULT 'general',
  custom_elements TEXT,
  sample_phrases JSONB DEFAULT '[]'::jsonb,
  
  -- Template metadata
  is_premium BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  popularity_score DECIMAL(4,2) DEFAULT 0.0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for AI generation history and learning
CREATE TABLE IF NOT EXISTS ai_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tone_profile_id UUID REFERENCES tone_profiles(id) ON DELETE SET NULL,
  
  -- Request details
  request_type VARCHAR(50) NOT NULL,
  input_context TEXT NOT NULL,
  ai_model_used VARCHAR(50) NOT NULL,
  ai_temperature DECIMAL(3,2) NOT NULL,
  ai_max_tokens INTEGER NOT NULL,
  
  -- Response details
  generated_content TEXT NOT NULL,
  response_time_ms INTEGER,
  token_usage INTEGER,
  
  -- Quality metrics
  quality_score DECIMAL(4,2), -- Calculated by system
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  was_edited BOOLEAN DEFAULT false,
  was_used BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tone_profiles_user_id ON tone_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tone_profiles_is_active ON tone_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_tone_profiles_is_default ON tone_profiles(is_default);
CREATE INDEX IF NOT EXISTS idx_tone_profiles_usage_count ON tone_profiles(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_tone_profile_usage_profile_id ON tone_profile_usage(tone_profile_id);
CREATE INDEX IF NOT EXISTS idx_tone_profile_usage_user_id ON tone_profile_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tone_profile_usage_context ON tone_profile_usage(usage_context);
CREATE INDEX IF NOT EXISTS idx_tone_profile_usage_used_at ON tone_profile_usage(used_at DESC);

CREATE INDEX IF NOT EXISTS idx_tone_templates_category ON tone_profile_templates(category);
CREATE INDEX IF NOT EXISTS idx_tone_templates_popularity ON tone_profile_templates(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_tone_templates_usage_count ON tone_profile_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generation_user_id ON ai_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_tone_profile ON ai_generation_history(tone_profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_created_at ON ai_generation_history(created_at DESC);

-- Functions and triggers for automatic updates
CREATE OR REPLACE FUNCTION update_tone_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_tone_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update usage count and last used timestamp
  UPDATE tone_profiles 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NEW.used_at,
    updated_at = NOW()
  WHERE id = NEW.tone_profile_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_tone_profiles_timestamp
  BEFORE UPDATE ON tone_profiles
  FOR EACH ROW EXECUTE FUNCTION update_tone_profile_timestamp();

CREATE TRIGGER update_tone_templates_timestamp
  BEFORE UPDATE ON tone_profile_templates  
  FOR EACH ROW EXECUTE FUNCTION update_tone_profile_timestamp();

CREATE TRIGGER update_tone_usage_stats_trigger
  AFTER INSERT ON tone_profile_usage
  FOR EACH ROW EXECUTE FUNCTION update_tone_usage_stats();

-- Constraint to ensure only one default profile per user
CREATE UNIQUE INDEX idx_tone_profiles_user_default 
ON tone_profiles(user_id) 
WHERE is_default = true AND is_active = true;

-- Insert default tone profile templates
INSERT INTO tone_profile_templates (name, category, description, formality_level, communication_style, personality_traits, industry_language, custom_elements, sample_phrases) VALUES
(
  'Professional HR Executive',
  'leadership',
  'Authoritative yet approachable tone for senior HR professionals',
  'professional',
  'consultative',
  ARRAY['authoritative', 'empathetic', 'analytical'],
  'hr_tech',
  'Focus on strategic impact and data-driven insights. Use industry terminology appropriately.',
  '["I''d love to hear your perspective on...", "This aligns well with current talent trends...", "Based on our experience with similar challenges..."]'::jsonb
),
(
  'Collaborative Peer',
  'networking',
  'Conversational and supportive tone for peer-to-peer engagement',
  'conversational',
  'collaborative',
  ARRAY['supportive', 'enthusiastic'],
  'general',
  'Emphasize shared experiences and mutual learning opportunities.',
  '["Great point! I''ve seen similar results when...", "Thanks for sharing this insight...", "I''d be curious to know how you..."]'::jsonb
),
(
  'Thought Leader',
  'content',
  'Innovative and analytical tone for establishing expertise',
  'professional',
  'direct',
  ARRAY['analytical', 'innovative', 'authoritative'],
  'leadership_development',
  'Position as an industry expert while remaining accessible. Include forward-thinking perspectives.',
  '["The data suggests an interesting trend...", "Looking ahead, we need to consider...", "This challenges the conventional approach by..."]'::jsonb
),
(
  'Sales Consultant',
  'sales',
  'Direct yet consultative approach for business development',
  'professional',
  'consultative',
  ARRAY['enthusiastic', 'analytical', 'supportive'],
  'sales',
  'Focus on value proposition and solving business challenges. Ask probing questions.',
  '["I''d be interested in understanding how...", "Many of our clients have found success with...", "What''s been your experience with..."]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Create views for analytics
CREATE OR REPLACE VIEW tone_profile_analytics AS
SELECT 
  tp.id,
  tp.name,
  tp.user_id,
  tp.usage_count,
  tp.effectiveness_score,
  tp.last_used_at,
  COUNT(tpu.id) as total_generations,
  AVG(tpu.user_satisfaction_rating) as avg_satisfaction,
  COUNT(CASE WHEN tpu.was_used = true THEN 1 END) as successful_usage_count,
  CASE 
    WHEN COUNT(tpu.id) > 0 THEN 
      (COUNT(CASE WHEN tpu.was_used = true THEN 1 END)::float / COUNT(tpu.id)::float * 100)
    ELSE 0 
  END as usage_success_rate
FROM tone_profiles tp
LEFT JOIN tone_profile_usage tpu ON tp.id = tpu.tone_profile_id
WHERE tp.is_active = true
GROUP BY tp.id, tp.name, tp.user_id, tp.usage_count, tp.effectiveness_score, tp.last_used_at;

CREATE OR REPLACE VIEW popular_tone_templates AS
SELECT 
  tpt.*,
  COUNT(tp.id) as times_copied,
  AVG(tpa.avg_satisfaction) as avg_user_satisfaction
FROM tone_profile_templates tpt
LEFT JOIN tone_profiles tp ON tp.name LIKE '%' || tpt.name || '%' -- Loose matching for templates that were copied
LEFT JOIN tone_profile_analytics tpa ON tp.id = tpa.id
GROUP BY tpt.id, tpt.name, tpt.category, tpt.description, tpt.formality_level, 
         tpt.communication_style, tpt.personality_traits, tpt.industry_language,
         tpt.custom_elements, tpt.sample_phrases, tpt.is_premium, tpt.usage_count,
         tpt.popularity_score, tpt.created_at, tpt.updated_at
ORDER BY tpt.popularity_score DESC, times_copied DESC;

-- Row Level Security policies
ALTER TABLE tone_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tone_profile_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tone profiles
CREATE POLICY "Users can manage their own tone profiles" ON tone_profiles
  FOR ALL USING (auth.jwt() ->> 'user_id' = user_id::text);

CREATE POLICY "Users can access their own usage data" ON tone_profile_usage
  FOR ALL USING (auth.jwt() ->> 'user_id' = user_id::text);

CREATE POLICY "Users can access their own generation history" ON ai_generation_history
  FOR ALL USING (auth.jwt() ->> 'user_id' = user_id::text);

-- Templates are readable by everyone
CREATE POLICY "Tone templates are publicly readable" ON tone_profile_templates
  FOR SELECT USING (true);