-- Prompt Library Module
-- Run in Supabase SQL Editor

-- ============================================
-- PROMPT LIBRARY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_library_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Core fields
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('coding', 'writing', 'analysis', 'creative', 'other')),
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,

  -- Full-text search (auto-generated)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT prompt_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT prompt_content_not_empty CHECK (length(trim(content)) > 0)
);

-- ============================================
-- INDEXES
-- ============================================

-- User filtering (most common query)
CREATE INDEX IF NOT EXISTS prompt_library_prompts_user_id_idx
  ON prompt_library_prompts(user_id);

-- Category filtering
CREATE INDEX IF NOT EXISTS prompt_library_prompts_category_idx
  ON prompt_library_prompts(user_id, category);

-- Tags filtering (GIN for array containment)
CREATE INDEX IF NOT EXISTS prompt_library_prompts_tags_idx
  ON prompt_library_prompts USING GIN(tags);

-- Full-text search (GIN for tsvector)
CREATE INDEX IF NOT EXISTS prompt_library_prompts_search_idx
  ON prompt_library_prompts USING GIN(search_vector);

-- Favorites quick access (partial index)
CREATE INDEX IF NOT EXISTS prompt_library_prompts_favorite_idx
  ON prompt_library_prompts(user_id, is_favorite)
  WHERE is_favorite = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE prompt_library_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prompts" ON prompt_library_prompts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_prompt_library_prompts_updated_at
  BEFORE UPDATE ON prompt_library_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
