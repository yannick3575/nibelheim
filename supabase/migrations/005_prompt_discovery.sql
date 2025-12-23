-- Add automation fields to prompt_library_prompts
-- Run in Supabase SQL Editor

ALTER TABLE prompt_library_prompts 
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' 
  CHECK (status IN ('draft', 'published', 'archived'));

-- Index for source_url to prevent duplicates if needed
CREATE INDEX IF NOT EXISTS prompt_library_prompts_source_url_idx ON prompt_library_prompts(source_url);

-- Index for status and is_automated for filtering
CREATE INDEX IF NOT EXISTS prompt_library_prompts_status_idx ON prompt_library_prompts(status, is_automated);
