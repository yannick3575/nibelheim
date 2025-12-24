-- Prompt Discovery Sources
-- Configurable sources for automated prompt discovery

CREATE TABLE IF NOT EXISTS prompt_discovery_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'github_raw'
    CHECK (source_type IN ('github_raw', 'github_api', 'web', 'rss')),
  category TEXT DEFAULT 'general'
    CHECK (category IN ('general', 'coding', 'writing', 'creative', 'analysis', 'system_prompts', 'other')),
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  last_fetched_at TIMESTAMPTZ,
  last_error TEXT,
  fetch_count INTEGER DEFAULT 0,
  prompts_extracted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS prompt_discovery_sources_enabled_idx
  ON prompt_discovery_sources(is_enabled, priority DESC);
CREATE INDEX IF NOT EXISTS prompt_discovery_sources_category_idx
  ON prompt_discovery_sources(category);

-- RLS Policies (sources are shared/public for now, admin-managed)
ALTER TABLE prompt_discovery_sources ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sources
CREATE POLICY "Users can view discovery sources"
  ON prompt_discovery_sources FOR SELECT
  TO authenticated
  USING (true);

-- Only allow updates via service role (backend)
CREATE POLICY "Service role can manage sources"
  ON prompt_discovery_sources FOR ALL
  TO service_role
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_prompt_discovery_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_discovery_sources_updated_at
  BEFORE UPDATE ON prompt_discovery_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_discovery_sources_updated_at();

-- Seed initial sources
INSERT INTO prompt_discovery_sources (name, description, url, source_type, category, priority) VALUES
-- Original source
('Awesome ChatGPT Prompts - CSV', 'The original awesome-chatgpt-prompts collection in CSV format',
 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv',
 'github_raw', 'general', 100),

('Awesome ChatGPT Prompts - README', 'Main documentation with prompt examples',
 'https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md',
 'github_raw', 'general', 90),

-- Claude-specific prompts
('Awesome Claude Prompts', 'Curated prompts specifically for Claude',
 'https://raw.githubusercontent.com/langgptai/awesome-claude-prompts/main/README.md',
 'github_raw', 'general', 95),

-- System prompts from real products
('AI System Prompts - Claude', 'Real system prompts from Claude products',
 'https://raw.githubusercontent.com/dontriskit/awesome-ai-system-prompts/main/Claude/2025-01-24-prompt.md',
 'github_raw', 'system_prompts', 85),

('AI System Prompts - Claude Code', 'Claude Code system prompt',
 'https://raw.githubusercontent.com/dontriskit/awesome-ai-system-prompts/main/Claude-Code/2025-08-12-prompt.md',
 'github_raw', 'coding', 80),

('AI System Prompts - Cursor', 'Cursor IDE system prompts',
 'https://raw.githubusercontent.com/dontriskit/awesome-ai-system-prompts/main/Cursor/2025-04-05-prompt.md',
 'github_raw', 'coding', 75),

('AI System Prompts - v0', 'Vercel v0 system prompts for UI generation',
 'https://raw.githubusercontent.com/dontriskit/awesome-ai-system-prompts/main/v0/2025-08-11-prompt.md',
 'github_raw', 'coding', 70),

('AI System Prompts - Loveable', 'Loveable app builder system prompts',
 'https://raw.githubusercontent.com/dontriskit/awesome-ai-system-prompts/main/Loveable/2025-03-10-prompt.md',
 'github_raw', 'coding', 65),

-- The Big Prompt Library
('Big Prompt Library - System Prompts', 'Large collection of system prompts',
 'https://raw.githubusercontent.com/0xeb/TheBigPromptLibrary/main/SystemPrompts/README.md',
 'github_raw', 'system_prompts', 60),

('Big Prompt Library - Custom Instructions', 'Custom instruction templates',
 'https://raw.githubusercontent.com/0xeb/TheBigPromptLibrary/main/CustomInstructions/README.md',
 'github_raw', 'general', 55)

ON CONFLICT (url) DO NOTHING;
