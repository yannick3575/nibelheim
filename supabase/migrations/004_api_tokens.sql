-- API Tokens for automation (Claude Chrome, etc.)

CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Claude Chrome", "Python Bot"
  token TEXT NOT NULL UNIQUE,
  scopes TEXT[] DEFAULT ARRAY['tech-watch:read', 'tech-watch:write'], -- Permissions
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- NULL = never expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS api_tokens_token_idx ON api_tokens(token);

-- Enable RLS
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage own tokens
CREATE POLICY "Users manage own API tokens" ON api_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_api_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate a 32-byte random token (base64 encoded)
  -- Format: nbh_<random_string> (nibelheim prefix)
  RETURN 'nbh_' || encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Automation logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token_id UUID REFERENCES api_tokens(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g., "article.create", "source.update"
  resource_type TEXT NOT NULL, -- "article", "source", "digest"
  resource_id UUID,
  metadata JSONB DEFAULT '{}', -- Extra context (e.g., article title, source URL)
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying logs
CREATE INDEX IF NOT EXISTS automation_logs_user_id_idx ON automation_logs(user_id);
CREATE INDEX IF NOT EXISTS automation_logs_created_at_idx ON automation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view own automation logs
CREATE POLICY "Users view own automation logs" ON automation_logs
  FOR SELECT USING (auth.uid() = user_id);
