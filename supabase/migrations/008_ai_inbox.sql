-- Migration: AI Inbox Tables
-- Created: 2024-12-30
-- Description: Creates tables for the AI Inbox module - manual content capture with AI analysis

-- ============================================================================
-- TABLE: ai_inbox_items
-- Stores user-submitted content items with AI analysis
-- ============================================================================

CREATE TABLE ai_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('youtube', 'substack', 'manual', 'other')),
    category TEXT NOT NULL DEFAULT 'news' CHECK (category IN ('tools', 'prompts', 'tutorials', 'news', 'inspiration')),
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    raw_content TEXT,
    ai_analysis JSONB,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate URLs per user
    UNIQUE(user_id, url)
);

-- Comment on table and columns for documentation
COMMENT ON TABLE ai_inbox_items IS 'User-submitted content items for AI analysis and tracking';
COMMENT ON COLUMN ai_inbox_items.source_type IS 'Origin of the content: youtube, substack, manual, or other';
COMMENT ON COLUMN ai_inbox_items.category IS 'Content category: tools, prompts, tutorials, news, or inspiration';
COMMENT ON COLUMN ai_inbox_items.status IS 'Read status: unread, read, or archived';
COMMENT ON COLUMN ai_inbox_items.ai_analysis IS 'JSON containing Gemini analysis: summary, actionability, complexity, project_ideas, etc.';

-- ============================================================================
-- TABLE: ai_inbox_settings
-- Stores user profile for personalized AI analysis
-- ============================================================================

CREATE TABLE ai_inbox_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    profile JSONB NOT NULL DEFAULT '{
        "current_stack": [],
        "current_projects": [],
        "skill_level": "intermediate",
        "interests": []
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ai_inbox_settings IS 'User preferences for personalized AI analysis in AI Inbox';
COMMENT ON COLUMN ai_inbox_settings.profile IS 'JSON containing current_stack, current_projects, skill_level, and interests';

-- ============================================================================
-- INDEXES
-- Optimize common query patterns
-- ============================================================================

-- Primary lookup: user's items
CREATE INDEX idx_ai_inbox_items_user_id ON ai_inbox_items(user_id);

-- Filter by status (most common filter - tabs in UI)
CREATE INDEX idx_ai_inbox_items_status ON ai_inbox_items(user_id, status);

-- Filter by category
CREATE INDEX idx_ai_inbox_items_category ON ai_inbox_items(user_id, category);

-- Filter by source type
CREATE INDEX idx_ai_inbox_items_source_type ON ai_inbox_items(user_id, source_type);

-- Partial index for favorites (only index true values)
CREATE INDEX idx_ai_inbox_items_favorite ON ai_inbox_items(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Settings lookup by user
CREATE INDEX idx_ai_inbox_settings_user_id ON ai_inbox_settings(user_id);

-- ============================================================================
-- TRIGGERS
-- Auto-update updated_at column (reuses existing function from 001_initial_schema)
-- ============================================================================

CREATE TRIGGER update_ai_inbox_items_updated_at
    BEFORE UPDATE ON ai_inbox_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_inbox_settings_updated_at
    BEFORE UPDATE ON ai_inbox_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Ensure users can only access their own data
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE ai_inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_inbox_settings ENABLE ROW LEVEL SECURITY;

-- ai_inbox_items policies
CREATE POLICY "Users can view their own items"
    ON ai_inbox_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items"
    ON ai_inbox_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
    ON ai_inbox_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
    ON ai_inbox_items FOR DELETE
    USING (auth.uid() = user_id);

-- ai_inbox_settings policies
CREATE POLICY "Users can view their own settings"
    ON ai_inbox_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
    ON ai_inbox_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON ai_inbox_settings FOR UPDATE
    USING (auth.uid() = user_id);
