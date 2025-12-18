-- Tech Watch Favorites Feature
-- Adds is_favorite column to track user's favorite articles

-- Add is_favorite column to tech_watch_articles
ALTER TABLE tech_watch_articles
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create partial index for efficient favorites queries
-- Only indexes rows where is_favorite = true (sparse index)
CREATE INDEX IF NOT EXISTS idx_tech_watch_articles_favorites
  ON tech_watch_articles(user_id, collected_at DESC)
  WHERE is_favorite = true;

-- Note: RLS policies already cover this column since we have:
-- "Users manage own articles" FOR ALL USING (auth.uid() = user_id)
